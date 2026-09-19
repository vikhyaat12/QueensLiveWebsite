"use client";

import React, { useState, useEffect, useRef } from "react";
import Hero3DProductVisual from "../components/Hero3DProductVisual";

export type Model3DItem = {
  id: string;
  name: string;
  description?: string;
  modelUrl: string;
  format: string;
  posterUrl?: string;
  productId?: string;
  productName?: string;
  isPrimary?: boolean;
  pageAssignment?: string;
  sort?: number;
  scale?: number;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  cameraDistance?: number;
  lightingIntensity?: number;
  autoRotate?: boolean;
  rotationSpeed?: number;
  enableShadow?: boolean;
  enableAnimation?: boolean;
  active?: boolean;
  visible?: boolean;
  createdAt?: string;
};

const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid var(--line)", fontSize: 13, borderRadius: 4, background: "#fff" };
const labelStyle = { fontSize: 11, fontWeight: 700 as const, display: "block" as const, marginBottom: 4, color: "#2A0F3A", textTransform: "uppercase" as const, letterSpacing: ".04em" };

export default function Model3DLibraryManager() {
  const [models, setModels] = useState<Model3DItem[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [editing, setEditing] = useState<Partial<Model3DItem> | null>(null);
  const [previewModel, setPreviewModel] = useState<Model3DItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; references?: string[] } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const [mRes, pRes] = await Promise.all([
        fetch("/api/admin/models3d"),
        fetch("/api/products?all=true"),
      ]);
      const mData = await mRes.json();
      const pData = await pRes.json();
      setModels(mData.models || []);
      setProducts((pData.products || []).map((p: Record<string, unknown>) => ({ id: String(p.id), name: String(p.name), slug: String(p.slug) })));
    } catch {
      setMsg("Failed to load 3D model library.");
      setIsError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const showNotice = (text: string, error = false) => {
    setMsg(text);
    setIsError(error);
    setTimeout(() => setMsg(""), 4000);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploading(true);
    const formData = new FormData();
    formData.append("folder", "models3d");
    formData.append("files", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.files?.length) {
        const uploaded = data.files[0];
        if (editing) {
          setEditing({
            ...editing,
            modelUrl: uploaded.url,
            format: uploaded.name.endsWith(".gltf") ? "gltf" : "glb",
          });
        } else {
          setEditing({
            name: file.name.replace(/\.[^.]+$/, ""),
            modelUrl: uploaded.url,
            format: uploaded.name.endsWith(".gltf") ? "gltf" : "glb",
            scale: 1.0,
            autoRotate: true,
            rotationSpeed: 0.8,
            cameraDistance: 4.5,
            lightingIntensity: 1.4,
            active: true,
            visible: true,
          });
        }
        showNotice("3D model file uploaded and linked!");
      } else {
        showNotice(data.error || "Upload failed.", true);
      }
    } catch {
      showNotice("Network error uploading 3D model.", true);
    }
    setUploading(false);
  };

  const saveModel = async () => {
    if (!editing?.name?.trim() || !editing?.modelUrl?.trim()) {
      showNotice("Model Name and Model File URL are required.", true);
      return;
    }

    try {
      const isNew = !editing.id;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch("/api/admin/models3d", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (res.ok) {
        showNotice(`3D model "${editing.name}" saved successfully!`);
        setEditing(null);
        fetchModels();
      } else {
        showNotice(data.error || "Failed to save 3D model.", true);
      }
    } catch {
      showNotice("Network error saving 3D model.", true);
    }
  };

  const handleDelete = async (id: string, force = false) => {
    try {
      const res = await fetch(`/api/admin/models3d?id=${encodeURIComponent(id)}${force ? "&force=true" : ""}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showNotice("3D model deleted from library.");
        setDeleteConfirm(null);
        fetchModels();
      } else if (data.inUse) {
        setDeleteConfirm({ id, name: deleteConfirm?.name || "Model", references: data.references });
      } else {
        showNotice(data.error || "Failed to delete 3D model.", true);
      }
    } catch {
      showNotice("Network error deleting 3D model.", true);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ font: "20px var(--font-display)", color: "#2A0F3A", margin: 0 }}>
            💎 Unlimited 3D Model Library
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Non-coder practical 3D asset repository. Assign multiple models (bottle, packaging, 360°) to products, hero showcases, or A+ content.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: "8px 16px",
              background: "var(--purple, #2A0F3A)",
              color: "#D4AF37",
              border: "none",
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {uploading ? "Uploading..." : "+ Upload 3D File (.glb/.gltf)"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            style={{ display: "none" }}
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          <button
            type="button"
            onClick={() =>
              setEditing({
                name: "New 3D Formulation Model",
                modelUrl: "",
                format: "glb",
                scale: 1.0,
                autoRotate: true,
                rotationSpeed: 0.8,
                cameraDistance: 4.5,
                lightingIntensity: 1.4,
                active: true,
                visible: true,
              })
            }
            style={{
              padding: "8px 16px",
              background: "#fff",
              color: "#2A0F3A",
              border: "1px solid var(--line)",
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            + Add Model by URL
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: "10px 14px", marginBottom: 16, borderRadius: 4, fontSize: 13, fontWeight: 600, background: isError ? "#fee2e2" : "#e0f2fe", color: isError ? "#991b1b" : "#0369a1", border: `1px solid ${isError ? "#f87171" : "#7dd3fc"}` }}>
          {msg}
        </div>
      )}

      {/* Model Editor Drawer / Modal */}
      {editing && (
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: 20, marginBottom: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ font: "16px var(--font-display)", color: "var(--purple)", margin: 0 }}>
              {editing.id ? `Edit 3D Model: ${editing.name}` : "Add New 3D Model"}
            </h4>
            <button
              type="button"
              onClick={() => setEditing(null)}
              style={{ background: "transparent", border: "none", fontSize: 16, cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
            {/* Left Column: Metadata & Assignment */}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={labelStyle}>Model Display Name *</label>
                <input
                  style={inputStyle}
                  value={editing.name || ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="e.g. LIKO-Q™ Flagship Amber Bottle"
                />
              </div>

              <div>
                <label style={labelStyle}>Model File URL or Path (.glb / .gltf) *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    style={inputStyle}
                    value={editing.modelUrl || ""}
                    onChange={(e) => setEditing({ ...editing, modelUrl: e.target.value })}
                    placeholder="/uploads/models3d/bottle.glb"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ padding: "0 12px", background: "#f1f5f9", border: "1px solid var(--line)", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}
                  >
                    Upload File
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Poster Image (Fallback / Loading Placeholder)</label>
                <input
                  style={inputStyle}
                  value={editing.posterUrl || ""}
                  onChange={(e) => setEditing({ ...editing, posterUrl: e.target.value })}
                  placeholder="/uploads/products/liko-q.png"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Assign to Product</label>
                  <select
                    style={inputStyle}
                    value={editing.productId || ""}
                    onChange={(e) => setEditing({ ...editing, productId: e.target.value || undefined })}
                  >
                    <option value="">-- No Product (Library Only) --</option>
                    {products.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name} ({p.slug})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Page / Section Assignment</label>
                  <select
                    style={inputStyle}
                    value={editing.pageAssignment || "none"}
                    onChange={(e) => setEditing({ ...editing, pageAssignment: e.target.value })}
                  >
                    <option value="none">None</option>
                    <option value="homepage">Homepage 3D Showcase</option>
                    <option value="science">Our Science Page</option>
                    <option value="aplus">Product A+ Content</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 20, paddingTop: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={editing.isPrimary || false}
                    onChange={(e) => setEditing({ ...editing, isPrimary: e.target.checked })}
                  />
                  <span>Primary Product Model</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={editing.autoRotate !== false}
                    onChange={(e) => setEditing({ ...editing, autoRotate: e.target.checked })}
                  />
                  <span>Auto-Rotate</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={editing.visible !== false}
                    onChange={(e) => setEditing({ ...editing, visible: e.target.checked })}
                  />
                  <span>Visible</span>
                </label>
              </div>
            </div>

            {/* Right Column: WebGL Camera & Lighting Settings */}
            <div style={{ background: "#fbf9f5", padding: 16, borderRadius: 6, border: "1px solid var(--line)" }}>
              <h5 style={{ fontSize: 12, textTransform: "uppercase", color: "var(--purple)", margin: "0 0 12px", letterSpacing: ".06em" }}>
                🎥 Camera, Lighting & Scale Tuning
              </h5>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Scale ({editing.scale ?? 1.0}x)</label>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.05"
                    value={editing.scale ?? 1.0}
                    onChange={(e) => setEditing({ ...editing, scale: parseFloat(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Rotation Speed ({editing.rotationSpeed ?? 0.8})</label>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={editing.rotationSpeed ?? 0.8}
                    onChange={(e) => setEditing({ ...editing, rotationSpeed: parseFloat(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Camera Distance ({editing.cameraDistance ?? 4.5})</label>
                  <input
                    type="range"
                    min="2.0"
                    max="10.0"
                    step="0.2"
                    value={editing.cameraDistance ?? 4.5}
                    onChange={(e) => setEditing({ ...editing, cameraDistance: parseFloat(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Lighting Intensity ({editing.lightingIntensity ?? 1.4})</label>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={editing.lightingIntensity ?? 1.4}
                    onChange={(e) => setEditing({ ...editing, lightingIntensity: parseFloat(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>Position Offset (X / Y / Z)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  <input
                    type="number"
                    step="0.1"
                    value={editing.positionX ?? 0}
                    onChange={(e) => setEditing({ ...editing, positionX: parseFloat(e.target.value) || 0 })}
                    placeholder="X"
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={editing.positionY ?? 0}
                    onChange={(e) => setEditing({ ...editing, positionY: parseFloat(e.target.value) || 0 })}
                    placeholder="Y"
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={editing.positionZ ?? 0}
                    onChange={(e) => setEditing({ ...editing, positionZ: parseFloat(e.target.value) || 0 })}
                    placeholder="Z"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid var(--line)", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveModel}
                  style={{ padding: "8px 20px", background: "var(--purple, #2A0F3A)", color: "#D4AF37", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                >
                  💾 Save 3D Model
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reference Deletion Warning Dialog */}
      {deleteConfirm && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 6, padding: 16, marginBottom: 20 }}>
          <h4 style={{ color: "#991B1B", margin: "0 0 6px", fontSize: 14 }}>
            ⚠️ Cannot Delete 3D Model: Active References Detected
          </h4>
          <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#7F1D1D" }}>
            This model is currently assigned to: <b>{deleteConfirm.references?.join(", ")}</b>. Deleting it will create missing visual states.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setDeleteConfirm(null)}
              style={{ padding: "6px 14px", background: "#fff", border: "1px solid #CBD5E1", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleDelete(deleteConfirm.id, true)}
              style={{ padding: "6px 14px", background: "#DC2626", color: "#fff", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Force Delete Anyway
            </button>
          </div>
        </div>
      )}

      {/* Model Grid */}
      {loading ? (
        <p style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>Loading 3D model library...</p>
      ) : models.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", background: "#fff", border: "1px solid var(--line)", borderRadius: 8 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💎</div>
          <b style={{ fontSize: 14 }}>No 3D models in library yet.</b>
          <p style={{ margin: "4px 0 14px", fontSize: 12, color: "var(--muted)" }}>
            Upload your first GLB or GLTF model to enable 360° interactive product inspection.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: "8px 18px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Upload 3D File
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {models.map((m) => (
            <div
              key={m.id}
              style={{
                background: "#fff",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <b style={{ fontSize: 14, color: "#1E1638" }}>{m.name}</b>
                    <span style={{ display: "inline-block", marginLeft: 8, fontSize: 10, padding: "2px 6px", borderRadius: 3, background: "#f1f5f9", fontWeight: 700, textTransform: "uppercase" }}>
                      {m.format}
                    </span>
                  </div>
                  {m.isPrimary && (
                    <span style={{ fontSize: 10, background: "#FEF3C7", color: "#92400E", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                      ★ PRIMARY
                    </span>
                  )}
                </div>

                <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
                  {m.description || "Interactive 3D model asset."}
                </p>

                <div style={{ fontSize: 11.5, color: "#475569", background: "#f8fafc", padding: "8px 10px", borderRadius: 4, marginBottom: 12 }}>
                  <div><b>Product:</b> {m.productName || m.productId || "Unassigned"}</div>
                  <div><b>Placement:</b> {m.pageAssignment || "None"}</div>
                  <div><b>Scale:</b> {m.scale ?? 1}x · <b>Light:</b> {m.lightingIntensity ?? 1.2}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setPreviewModel(m)}
                  style={{ background: "transparent", border: "none", color: "var(--purple)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  👁️ Inspect 3D
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setEditing(m)}
                    style={{ padding: "5px 10px", background: "#f1f5f9", border: "1px solid var(--line)", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm({ id: m.id, name: m.name })}
                    style={{ padding: "5px 10px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect / Preview Modal */}
      {previewModel && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#120b18",
              borderRadius: 12,
              width: "100%",
              maxWidth: 700,
              overflow: "hidden",
              border: "1px solid rgba(212,175,55,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <div>
                <b style={{ fontSize: 15, color: "#fff" }}>{previewModel.name}</b>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#D4AF37" }}>
                  Interactive 3D WebGL Drag & Rotate Preview
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModel(null)}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <div style={{ height: 420, position: "relative" }}>
              <Hero3DProductVisual
                productName={previewModel.name}
                subtitle="Clinical Grade Pharmaceutical 3D Visualizer"
                verticalLabel="360° WEBGL INSPECTION"
                customImageUrl={previewModel.posterUrl || "/uploads/liko-q-suspension.png"}
                scale={previewModel.scale ?? 1.0}
                autoRotate={previewModel.autoRotate ?? true}
                rotationSpeed={previewModel.rotationSpeed ?? 0.8}
                lightingIntensity={previewModel.lightingIntensity ?? 1.4}
                accentColor="#D4AF37"
                bgEffect="studio"
              />
            </div>
            <div style={{ padding: "12px 20px", background: "rgba(255,255,255,0.03)", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setPreviewModel(null)}
                style={{ padding: "7px 18px", background: "var(--purple)", color: "#D4AF37", border: "1px solid #D4AF37", borderRadius: 4, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
