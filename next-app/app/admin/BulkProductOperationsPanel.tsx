"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";

type Snapshot = {
  id: string;
  timestamp: string;
  actorEmail: string;
  itemCount: number;
  reason: string;
};

type DiffItem = {
  slug: string;
  name: string;
  isNew: boolean;
  changes: Array<{ field: string; oldVal: unknown; newVal: unknown }>;
  errors: string[];
};

type Product = {
  id: string;
  slug: string;
  name: string;
  category?: string;
  price: number;
  mrp?: number;
  stock: number;
  lowStockThreshold?: number;
  active?: boolean;
  visible?: boolean;
  gstRate?: number;
  hsn?: string;
  sku?: string;
  image?: string;
};

type BulkModalType = "visibility" | "price" | "tax" | "stock" | "category" | null;

export default function BulkProductOperationsPanel({
  onRefreshCatalog,
}: {
  onRefreshCatalog?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"multiselect" | "csv" | "formula" | "snapshots">("multiselect");

  // Multi-select product catalog state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "active" | "hidden">("all");

  // Modal State for Grouped Bulk Updates
  const [activeModal, setActiveModal] = useState<BulkModalType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for modals
  const [visChoice, setVisChoice] = useState<"visible" | "hidden">("visible");
  const [priceOp, setPriceOp] = useState<"percentage_increase" | "percentage_decrease" | "flat_increase" | "flat_decrease" | "set_value" | "set_mrp">("percentage_increase");
  const [priceVal, setPriceVal] = useState("");
  const [taxGst, setTaxGst] = useState("18");
  const [taxHsn, setTaxHsn] = useState("330499");
  const [stockOp, setStockOp] = useState<"add" | "subtract" | "set_value" | "set_threshold">("add");
  const [stockVal, setStockVal] = useState("");
  const [targetCategory, setTargetCategory] = useState("Dermatology");
  const [customCategory, setCustomCategory] = useState("");

  // CSV State
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<DiffItem[] | null>(null);
  const [previewStats, setPreviewStats] = useState<{ total: number; errors: number; valid: boolean } | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  // Batch Formula State
  const [batchScope, setBatchScope] = useState("all");
  const [batchDimension, setBatchDimension] = useState<"price" | "stock" | "gst">("price");
  const [batchOp, setBatchOp] = useState("percentage_increase");
  const [batchVal, setBatchVal] = useState("");

  // Rollback Snapshots State
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  // Feedback Notification
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/products?all=true");
      const data = await res.json();
      if (res.ok && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch {
      // Fallback
    }
    setLoadingProducts(false);
  }, []);

  const loadSnapshots = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products/bulk?action=snapshots");
      const data = await res.json();
      if (res.ok && data.snapshots) {
        setSnapshots(data.snapshots);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadProducts();
    loadSnapshots();
  }, [loadProducts, loadSnapshots]);

  // Derived category list
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchSlug = p.slug?.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        if (!matchName && !matchSlug && !matchSku) return false;
      }

      // Category
      if (categoryFilter !== "all" && p.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Stock Status
      const threshold = p.lowStockThreshold ?? 10;
      const stock = Number(p.stock || 0);
      if (stockFilter === "in_stock" && stock <= 0) return false;
      if (stockFilter === "out_of_stock" && stock > 0) return false;
      if (stockFilter === "low_stock" && (stock <= 0 || stock > threshold)) return false;

      // Visibility
      const isVisible = p.active !== false && p.visible !== false;
      if (visibilityFilter === "active" && !isVisible) return false;
      if (visibilityFilter === "hidden" && isVisible) return false;

      return true;
    });
  }, [products, searchTerm, categoryFilter, stockFilter, visibilityFilter]);

  // Multi-Select Handlers
  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedIds);
    filteredProducts.forEach((p) => next.add(p.id || p.slug));
    setSelectedIds(next);
  };

  const deselectAllFiltered = () => {
    const next = new Set(selectedIds);
    filteredProducts.forEach((p) => next.delete(p.id || p.slug));
    setSelectedIds(next);
  };

  const clearAllSelection = () => {
    setSelectedIds(new Set());
  };

  const isAllFilteredSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id || p.slug));
  const selectedProductsList = useMemo(() => {
    return products.filter((p) => selectedIds.has(p.id || p.slug));
  }, [products, selectedIds]);

  // Execute Bulk Action
  const handleExecuteBulkUpdate = async (updates: Record<string, unknown>, actionDesc: string) => {
    if (selectedIds.size === 0) return;
    setIsSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_update",
          productIds: Array.from(selectedIds),
          updates,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✓ Success: ${data.updatedCount} product(s) modified (${actionDesc}). Safety snapshot ${data.snapshotId} generated.`);
        setActiveModal(null);
        clearAllSelection();
        await loadProducts();
        await loadSnapshots();
        onRefreshCatalog?.();
      } else {
        setIsError(true);
        setMessage(data.error || "Bulk update failed.");
      }
    } catch {
      setIsError(true);
      setMessage("Network error executing bulk update.");
    }
    setIsSubmitting(false);
  };

  // CSV Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = String(evt.target?.result || "");
      setCsvText(content);
      handleCsvPreview(content);
    };
    reader.readAsText(file);
  };

  const handleCsvPreview = async (textToPreview?: string) => {
    const text = textToPreview || csvText;
    if (!text.trim()) {
      setIsError(true);
      setMessage("Please paste or upload CSV content first.");
      return;
    }
    setCsvLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", csvText: text }),
      });
      const data = await res.json();
      if (res.ok) {
        setPreview(data.preview);
        setPreviewStats({ total: data.totalRows, errors: data.errorCount, valid: data.valid });
        if (data.errorCount > 0) {
          setIsError(true);
          setMessage(`CSV validation finished with ${data.errorCount} row error(s). Please review diffs.`);
        } else {
          setMessage(`CSV validated successfully! ${data.totalRows} product(s) ready to import.`);
        }
      } else {
        setIsError(true);
        setMessage(data.error || "Failed to preview CSV.");
      }
    } catch {
      setIsError(true);
      setMessage("Network error during CSV preview.");
    }
    setCsvLoading(false);
  };

  const handleCsvCommit = async () => {
    if (!csvText.trim()) return;
    if (!confirm("Are you sure you want to commit these catalog changes? A safety snapshot will be created automatically.")) return;
    setCsvLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "commit", csvText }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Success! Catalog updated: ${data.updatedCount} updated, ${data.createdCount} created. (Snapshot: ${data.snapshotId})`);
        setPreview(null);
        setCsvText("");
        setPreviewStats(null);
        loadSnapshots();
        loadProducts();
        onRefreshCatalog?.();
      } else {
        setIsError(true);
        setMessage(data.error || "Failed to commit bulk update.");
      }
    } catch {
      setIsError(true);
      setMessage("Network error during bulk commit.");
    }
    setCsvLoading(false);
  };

  // Batch Formula Handler
  const handleBatchAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchVal || isNaN(parseFloat(batchVal))) {
      setIsError(true);
      setMessage("Please enter a valid numeric value for the adjustment.");
      return;
    }
    if (!confirm(`Apply ${batchDimension} adjustment (${batchOp} by ${batchVal}) to ${batchScope === "all" ? "ALL products" : `category '${batchScope}'`}?`)) return;

    setCsvLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_adjust",
          targetCategory: batchScope,
          adjustType: batchDimension,
          operation: batchOp,
          value: batchVal,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Successfully adjusted ${batchDimension} for ${data.affectedCount} product(s)! Snapshot: ${data.snapshotId}`);
        loadSnapshots();
        loadProducts();
        onRefreshCatalog?.();
      } else {
        setIsError(true);
        setMessage(data.error || "Batch adjustment failed.");
      }
    } catch {
      setIsError(true);
      setMessage("Network error during batch adjustment.");
    }
    setCsvLoading(false);
  };

  // Rollback Handler
  const handleRollback = async (snapshotId: string) => {
    if (!confirm(`Are you sure you want to ROLL BACK to snapshot ${snapshotId}? Current catalog will be restored to that state.`)) return;
    setCsvLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback", snapshotId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Rollback complete! Restored ${data.restoredCount} product(s) from ${data.snapshotTimestamp}.`);
        loadSnapshots();
        loadProducts();
        onRefreshCatalog?.();
      } else {
        setIsError(true);
        setMessage(data.error || "Failed to rollback.");
      }
    } catch {
      setIsError(true);
      setMessage("Network error during rollback.");
    }
    setCsvLoading(false);
  };

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 8, border: "1px solid var(--line, #e2e8f0)", marginBottom: 24 }}>
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, color: "var(--purple, #2A0F3A)", fontWeight: 700 }}>
            Bulk Product Management & Operations Center
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted, #64748B)" }}>
            Multi-select live catalog products, batch update prices, tax & GST, listing visibility, inventory, or import/export CSV.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href="/api/admin/products/bulk?action=export"
            download
            style={{
              padding: "7px 14px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "#334155",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>📊 Export Live Catalog (.csv)</span>
          </a>
          <a
            href="/api/admin/products/bulk?action=template"
            download
            style={{
              padding: "7px 14px",
              background: "#fff",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>📥 Blank Template</span>
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e2e8f0", marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("multiselect")}
          style={{
            padding: "9px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "multiselect" ? "3px solid var(--purple, #2A0F3A)" : "3px solid transparent",
            color: activeTab === "multiselect" ? "var(--purple, #2A0F3A)" : "#64748b",
            fontWeight: activeTab === "multiselect" ? 700 : 500,
            fontSize: 13,
            cursor: "pointer",
            marginBottom: -2,
          }}
        >
          ⚡ Interactive Multi-Select & Bulk Edit ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("csv")}
          style={{
            padding: "9px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "csv" ? "3px solid var(--purple, #2A0F3A)" : "3px solid transparent",
            color: activeTab === "csv" ? "var(--purple, #2A0F3A)" : "#64748b",
            fontWeight: activeTab === "csv" ? 700 : 500,
            fontSize: 13,
            cursor: "pointer",
            marginBottom: -2,
          }}
        >
          📥 CSV / Excel Import & Diff
        </button>
        <button
          onClick={() => setActiveTab("formula")}
          style={{
            padding: "9px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "formula" ? "3px solid var(--purple, #2A0F3A)" : "3px solid transparent",
            color: activeTab === "formula" ? "var(--purple, #2A0F3A)" : "#64748b",
            fontWeight: activeTab === "formula" ? 700 : 500,
            fontSize: 13,
            cursor: "pointer",
            marginBottom: -2,
          }}
        >
          📈 Category Formula Adjustments
        </button>
        <button
          onClick={() => setActiveTab("snapshots")}
          style={{
            padding: "9px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "snapshots" ? "3px solid var(--purple, #2A0F3A)" : "3px solid transparent",
            color: activeTab === "snapshots" ? "var(--purple, #2A0F3A)" : "#64748b",
            fontWeight: activeTab === "snapshots" ? 700 : 500,
            fontSize: 13,
            cursor: "pointer",
            marginBottom: -2,
          }}
        >
          🕒 Safety Snapshots ({snapshots.length})
        </button>
      </div>

      {/* Global Message Banner */}
      {message && (
        <div
          style={{
            padding: "10px 16px",
            marginBottom: 16,
            borderRadius: 6,
            fontSize: 13,
            background: isError ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${isError ? "#f87171" : "#86efac"}`,
            color: isError ? "#991b1b" : "#166534",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{message}</span>
          <button
            onClick={() => setMessage("")}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: MULTI-SELECT CATALOG */}
      {activeTab === "multiselect" && (
        <div>
          {/* Filter Bar */}
          <div
            style={{
              padding: 14,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              marginBottom: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>
                Search Product / SKU
              </label>
              <input
                type="text"
                placeholder="Search name, slug, SKU…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "6px 10px", fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>
                Category Filter
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ width: "100%", padding: "6px 10px", fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
              >
                <option value="all">All Categories ({products.length})</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>
                Stock Status
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                style={{ width: "100%", padding: "6px 10px", fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock (&gt; 0)</option>
                <option value="low_stock">Low Stock (≤ threshold)</option>
                <option value="out_of_stock">Out of Stock (= 0)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>
                Storefront Listing Visibility
              </label>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as any)}
                style={{ width: "100%", padding: "6px 10px", fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
              >
                <option value="all">All Listing Statuses</option>
                <option value="active">Active (Visible in Store)</option>
                <option value="hidden">Hidden / Inactive</option>
              </select>
            </div>
          </div>

          {/* Action Toolbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 12,
              padding: "10px 14px",
              background: selectedIds.size > 0 ? "#eff6ff" : "#fafafa",
              border: `1px solid ${selectedIds.size > 0 ? "#bfdbfe" : "#e2e8f0"}`,
              borderRadius: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: selectedIds.size > 0 ? "#1e40af" : "#475569" }}>
                {selectedIds.size} of {filteredProducts.length} filtered products selected
              </span>
              <button
                onClick={isAllFilteredSelected ? deselectAllFiltered : selectAllFiltered}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  background: "#fff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {isAllFilteredSelected ? "Deselect Filtered" : "Select All Filtered"}
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={clearAllSelection}
                  style={{
                    padding: "4px 10px",
                    fontSize: 11,
                    background: "none",
                    border: "none",
                    color: "#dc2626",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Grouped Bulk Action Triggers */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                disabled={selectedIds.size === 0}
                onClick={() => setActiveModal("visibility")}
                style={{
                  padding: "6px 12px",
                  background: selectedIds.size > 0 ? "#fff" : "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: selectedIds.size > 0 ? "#1e293b" : "#94a3b8",
                  cursor: selectedIds.size > 0 ? "pointer" : "not-allowed",
                }}
              >
                👁️ Visibility / Status
              </button>

              <button
                disabled={selectedIds.size === 0}
                onClick={() => setActiveModal("price")}
                style={{
                  padding: "6px 12px",
                  background: selectedIds.size > 0 ? "#fff" : "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: selectedIds.size > 0 ? "#1e293b" : "#94a3b8",
                  cursor: selectedIds.size > 0 ? "pointer" : "not-allowed",
                }}
              >
                💰 Bulk Price
              </button>

              <button
                disabled={selectedIds.size === 0}
                onClick={() => setActiveModal("tax")}
                style={{
                  padding: "6px 12px",
                  background: selectedIds.size > 0 ? "#fff" : "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: selectedIds.size > 0 ? "#1e293b" : "#94a3b8",
                  cursor: selectedIds.size > 0 ? "pointer" : "not-allowed",
                }}
              >
                📑 GST / Tax
              </button>

              <button
                disabled={selectedIds.size === 0}
                onClick={() => setActiveModal("stock")}
                style={{
                  padding: "6px 12px",
                  background: selectedIds.size > 0 ? "#fff" : "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: selectedIds.size > 0 ? "#1e293b" : "#94a3b8",
                  cursor: selectedIds.size > 0 ? "pointer" : "not-allowed",
                }}
              >
                📦 Inventory / Stock
              </button>

              <button
                disabled={selectedIds.size === 0}
                onClick={() => setActiveModal("category")}
                style={{
                  padding: "6px 12px",
                  background: selectedIds.size > 0 ? "#fff" : "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: selectedIds.size > 0 ? "#1e293b" : "#94a3b8",
                  cursor: selectedIds.size > 0 ? "pointer" : "not-allowed",
                }}
              >
                🏷️ Move Category
              </button>
            </div>
          </div>

          {/* Catalog Data Table */}
          {loadingProducts ? (
            <p style={{ textAlign: "center", padding: 30, color: "#64748b" }}>Loading catalog…</p>
          ) : filteredProducts.length === 0 ? (
            <p style={{ textAlign: "center", padding: 30, color: "#64748b" }}>No products match the selected filters.</p>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 6 }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
                    <th style={{ width: 40, padding: "10px 12px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        onChange={isAllFilteredSelected ? deselectAllFiltered : selectAllFiltered}
                        aria-label="Select all filtered products"
                      />
                    </th>
                    <th style={{ padding: "10px 12px" }}>Product Name & SKU</th>
                    <th style={{ padding: "10px 12px" }}>Category</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Price / MRP</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>Stock</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>GST %</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>Storefront Visibility</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const id = p.id || p.slug;
                    const isSelected = selectedIds.has(id);
                    const isVisible = p.active !== false && p.visible !== false;
                    const threshold = p.lowStockThreshold ?? 10;
                    const stock = Number(p.stock || 0);

                    return (
                      <tr
                        key={id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: isSelected ? "#f0f9ff" : "#fff",
                        }}
                      >
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(id)}
                            aria-label={`Select ${p.name}`}
                          />
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontWeight: 600, color: "#1e293b" }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>
                            /{p.slug} {p.sku ? `• SKU: ${p.sku}` : ""}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 12, background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 500 }}>
                            {p.category || "General"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          <div style={{ fontWeight: 700, color: "#1e293b" }}>₹{Number(p.price).toLocaleString("en-IN")}</div>
                          {p.mrp ? (
                            <div style={{ fontSize: 10, color: "#94a3b8", textDecoration: "line-through" }}>
                              MRP: ₹{Number(p.mrp).toLocaleString("en-IN")}
                            </div>
                          ) : null}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 600,
                              background: stock <= 0 ? "#fee2e2" : stock <= threshold ? "#fef3c7" : "#dcfce7",
                              color: stock <= 0 ? "#b91c1c" : stock <= threshold ? "#d97706" : "#15803d",
                            }}
                          >
                            {stock} units
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span style={{ fontFamily: "monospace", fontSize: 11 }}>{p.gstRate ?? 18}%</span>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              color: isVisible ? "#16a34a" : "#94a3b8",
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isVisible ? "#16a34a" : "#cbd5e1" }} />
                            {isVisible ? "Active / Visible" : "Hidden"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CSV IMPORT / EXPORT */}
      {activeTab === "csv" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, marginBottom: 24 }}>
            <div style={{ padding: 18, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fafafa" }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 15, color: "#1e293b", fontWeight: 600 }}>
                Upload & Validate CSV Catalog
              </h4>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748B" }}>
                Import updated prices, stock, GST rates, or new products. A safety snapshot is created before applying.
              </p>

              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                style={{ marginBottom: 12, fontSize: 12 }}
              />

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Or paste CSV content here..."
                rows={5}
                style={{ width: "100%", padding: 10, fontSize: 12, fontFamily: "monospace", borderRadius: 6, border: "1px solid #cbd5e1", marginBottom: 12, resize: "vertical" }}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => handleCsvPreview()}
                  disabled={csvLoading || !csvText.trim()}
                  style={{
                    flex: 1,
                    padding: "8px 14px",
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  {csvLoading ? "Validating…" : "🔍 Validate & Preview Diffs"}
                </button>
                {preview && (
                  <button
                    onClick={handleCsvCommit}
                    disabled={csvLoading || !previewStats?.valid}
                    style={{
                      flex: 1,
                      padding: "8px 14px",
                      background: previewStats?.valid ? "#16a34a" : "#94a3b8",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#fff",
                      cursor: previewStats?.valid ? "pointer" : "not-allowed",
                    }}
                  >
                    {csvLoading ? "Committing…" : "✓ Commit All Changes"}
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: 18, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fafafa" }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 15, color: "#1e293b", fontWeight: 600 }}>
                CSV Import Guidelines & Standards
              </h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#64748b", lineHeight: 1.8 }}>
                <li>Required columns: <code>slug, name, price, stock, category</code></li>
                <li>Optional columns: <code>mrp, sku, hsn, gstRate, active, description, benefits</code></li>
                <li>Prices must be valid positive numbers (INR)</li>
                <li>GST rates should be standard Indian brackets: <code>0, 5, 12, 18, 28</code></li>
                <li>Existing products are matched strictly by <code>slug</code> or exact name</li>
                <li>Unmatched slugs will be created as new catalog entries</li>
              </ul>
            </div>
          </div>

          {/* Preview Table */}
          {preview && (
            <div style={{ marginBottom: 24, border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, background: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 15, color: "#1e293b", fontWeight: 700 }}>
                  Diff Preview ({preview.length} Rows Detected)
                </h4>
                <span style={{ fontSize: 12, fontWeight: 600, color: previewStats?.valid ? "#16a34a" : "#dc2626" }}>
                  {previewStats?.valid ? "✓ No validation errors" : `⚠️ ${previewStats?.errors} row(s) contain errors`}
                </span>
              </div>

              <div style={{ overflowX: "auto", maxHeight: 320 }}>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                      <th style={{ padding: "8px 10px" }}>Slug / ID</th>
                      <th style={{ padding: "8px 10px" }}>Product Name</th>
                      <th style={{ padding: "8px 10px" }}>Action</th>
                      <th style={{ padding: "8px 10px" }}>Detected Modifications</th>
                      <th style={{ padding: "8px 10px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0", background: p.errors.length ? "#fff1f2" : "#fff" }}>
                        <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11 }}>{p.slug}</td>
                        <td style={{ padding: "8px 10px", fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: p.isNew ? "#dcfce7" : "#e0f2fe", color: p.isNew ? "#166534" : "#0369a1" }}>
                            {p.isNew ? "CREATE" : "UPDATE"}
                          </span>
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          {p.changes.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {p.changes.map((c, cIdx) => (
                                <span key={cIdx} style={{ fontSize: 11, background: "#fef9c3", padding: "1px 6px", borderRadius: 3, border: "1px solid #fef08a" }}>
                                  <b>{c.field}:</b> {String(c.oldVal)} → <b>{String(c.newVal)}</b>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: 11 }}>No field changes</span>
                          )}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          {p.errors.length > 0 ? (
                            <span style={{ color: "#dc2626", fontWeight: 600, fontSize: 11 }}>{p.errors.join(", ")}</span>
                          ) : (
                            <span style={{ color: "#16a34a", fontSize: 11 }}>Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CATEGORY FORMULA */}
      {activeTab === "formula" && (
        <div style={{ maxWidth: 650, margin: "0 auto", padding: 20, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fafafa" }}>
          <h4 style={{ margin: "0 0 10px", fontSize: 15, color: "#1e293b", fontWeight: 600 }}>
            Mass Adjustment Formula Tool
          </h4>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748B" }}>
            Execute bulk adjustments across entire categories or the whole catalog with 1 click.
          </p>

          <form onSubmit={handleBatchAdjust} style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
                  Target Dimension
                </label>
                <select
                  value={batchDimension}
                  onChange={(e) => {
                    const dim = e.target.value as "price" | "stock" | "gst";
                    setBatchDimension(dim);
                    if (dim === "gst") setBatchOp("set_value");
                  }}
                  style={{ width: "100%", padding: 8, fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
                >
                  <option value="price">Price (₹)</option>
                  <option value="stock">Stock Units</option>
                  <option value="gst">GST Rate (%)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
                  Formula Operation
                </label>
                <select
                  value={batchOp}
                  onChange={(e) => setBatchOp(e.target.value)}
                  style={{ width: "100%", padding: 8, fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
                >
                  {batchDimension === "price" && (
                    <>
                      <option value="percentage_increase">Increase by %</option>
                      <option value="percentage_decrease">Decrease by %</option>
                      <option value="flat_increase">Increase by flat ₹</option>
                      <option value="flat_decrease">Decrease by flat ₹</option>
                      <option value="set_value">Set Exact Price (₹)</option>
                    </>
                  )}
                  {batchDimension === "stock" && (
                    <>
                      <option value="flat_increase">Add Units (+)</option>
                      <option value="flat_decrease">Subtract Units (-)</option>
                      <option value="set_value">Set Exact Stock</option>
                    </>
                  )}
                  {batchDimension === "gst" && (
                    <option value="set_value">Set Exact GST %</option>
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
                  Category Scope
                </label>
                <select
                  value={batchScope}
                  onChange={(e) => setBatchScope(e.target.value)}
                  style={{ width: "100%", padding: 8, fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
                >
                  <option value="all">Entire Catalog (All)</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
                  Value ({batchOp.includes("percentage") ? "%" : batchDimension === "price" ? "₹" : "Units"})
                </label>
                <input
                  type="number"
                  step="any"
                  value={batchVal}
                  onChange={(e) => setBatchVal(e.target.value)}
                  placeholder="e.g. 10 or 150"
                  required
                  style={{ width: "100%", padding: 8, fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={csvLoading}
              style={{
                marginTop: 6,
                padding: "10px 16px",
                background: "var(--purple, #2A0F3A)",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {csvLoading ? "Applying Formula…" : "⚡ Execute Batch Adjustment"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: SAFETY ROLLBACK SNAPSHOTS */}
      {activeTab === "snapshots" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 15, color: "#334155", fontWeight: 600 }}>
              Audit Snapshots & Rollback Vault
            </h4>
            <button
              onClick={loadSnapshots}
              style={{ padding: "4px 10px", fontSize: 11, background: "#fff", border: "1px solid #cbd5e1", borderRadius: 4, cursor: "pointer" }}
            >
              🔄 Refresh Snapshots
            </button>
          </div>

          {snapshots.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>No bulk snapshots recorded yet.</p>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 6 }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                    <th style={{ padding: "8px 12px" }}>Snapshot ID</th>
                    <th style={{ padding: "8px 12px" }}>Timestamp</th>
                    <th style={{ padding: "8px 12px" }}>Operator</th>
                    <th style={{ padding: "8px 12px" }}>Catalog Size</th>
                    <th style={{ padding: "8px 12px" }}>Operation Details</th>
                    <th style={{ padding: "8px 12px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>{s.id}</td>
                      <td style={{ padding: "8px 12px", color: "#64748B" }}>{new Date(s.timestamp).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "8px 12px" }}>{s.actorEmail}</td>
                      <td style={{ padding: "8px 12px" }}>{s.itemCount} items</td>
                      <td style={{ padding: "8px 12px", color: "#475569" }}>{s.reason}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <button
                          onClick={() => handleRollback(s.id)}
                          disabled={csvLoading}
                          style={{
                            padding: "4px 10px",
                            background: "#fee2e2",
                            border: "1px solid #fca5a5",
                            borderRadius: 4,
                            fontSize: 11,
                            color: "#b91c1c",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Restore State
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION & ACTION MODALS */}
      {activeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              maxWidth: 520,
              width: "100%",
              padding: 24,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, color: "#1e293b", fontWeight: 700 }}>
                {activeModal === "visibility" && "Bulk Update: Storefront Visibility"}
                {activeModal === "price" && "Bulk Update: Product Pricing"}
                {activeModal === "tax" && "Bulk Update: GST & Tax"}
                {activeModal === "stock" && "Bulk Update: Inventory & Stock"}
                {activeModal === "category" && "Bulk Update: Reassign Category"}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>

            {/* Selected Products Summary Tag */}
            <div style={{ padding: "8px 12px", background: "#f1f5f9", borderRadius: 6, fontSize: 12, color: "#334155", marginBottom: 16 }}>
              <strong>{selectedIds.size} product(s) selected:</strong>
              <div style={{ maxHeight: 60, overflowY: "auto", marginTop: 4, fontSize: 11, color: "#64748b" }}>
                {selectedProductsList.map((p) => p.name).join(", ")}
              </div>
            </div>

            {/* MODAL 1: VISIBILITY */}
            {activeModal === "visibility" && (
              <div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#475569" }}>
                  Choose whether the selected products should be publicly active and visible on the storefront:
                </p>
                <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="visChoice"
                      value="visible"
                      checked={visChoice === "visible"}
                      onChange={() => setVisChoice("visible")}
                    />
                    <strong>Active & Visible</strong> (Customers can find & purchase these products)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="visChoice"
                      value="hidden"
                      checked={visChoice === "hidden"}
                      onChange={() => setVisChoice("hidden")}
                    />
                    <strong>Hidden & Inactive</strong> (Hidden from storefront and public listings)
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={() => setActiveModal(null)}
                    style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={() =>
                      handleExecuteBulkUpdate(
                        { active: visChoice === "visible", visible: visChoice === "visible" },
                        `Set visibility to ${visChoice}`
                      )
                    }
                    style={{
                      padding: "8px 18px",
                      background: visChoice === "visible" ? "#16a34a" : "#dc2626",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {isSubmitting ? "Applying…" : `Confirm & Set ${visChoice === "visible" ? "Active" : "Hidden"}`}
                  </button>
                </div>
              </div>
            )}

            {/* MODAL 2: PRICE */}
            {activeModal === "price" && (
              <div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#475569" }}>
                  Adjust prices across all selected products:
                </p>
                <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
                      Pricing Action
                    </label>
                    <select
                      value={priceOp}
                      onChange={(e) => setPriceOp(e.target.value as any)}
                      style={{ width: "100%", padding: 8, fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
                    >
                      <option value="percentage_increase">Increase by % (+%)</option>
                      <option value="percentage_decrease">Decrease by % (-%)</option>
                      <option value="flat_increase">Increase by flat ₹ (+₹)</option>
                      <option value="flat_decrease">Decrease by flat ₹ (-₹)</option>
                      <option value="set_value">Set Exact Price (₹)</option>
                      <option value="set_mrp">Set Exact MRP / Original Price (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
                      Value ({priceOp.includes("percentage") ? "%" : "₹"})
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 10 or 1499"
                      value={priceVal}
                      onChange={(e) => setPriceVal(e.target.value)}
                      style={{ width: "100%", padding: 8, fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={() => setActiveModal(null)}
                    style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isSubmitting || !priceVal}
                    onClick={() => {
                      const numVal = parseFloat(priceVal);
                      if (isNaN(numVal) || numVal < 0) {
                        alert("Please enter a valid non-negative number.");
                        return;
                      }

                      if (priceOp === "set_value") {
                        handleExecuteBulkUpdate({ price: numVal }, `Set price to ₹${numVal}`);
                      } else if (priceOp === "set_mrp") {
                        handleExecuteBulkUpdate({ mrp: numVal }, `Set MRP to ₹${numVal}`);
                      } else {
                        handleExecuteBulkUpdate(
                          { priceAdjustment: { operation: priceOp, value: numVal } },
                          `Price ${priceOp} (${numVal})`
                        );
                      }
                    }}
                    style={{
                      padding: "8px 18px",
                      background: "var(--purple, #2A0F3A)",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {isSubmitting ? "Applying…" : "Apply Price Modification"}
                  </button>
                </div>
              </div>
            )}

            {/* MODAL 3: TAX & GST */}
            {activeModal === "tax" && (
              <div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#475569" }}>
                  Configure GST tax rate and HSN classification for selected products:
                </p>
                <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
                      GST Rate Bracket
                    </label>
                    <select
                      value={taxGst}
                      onChange={(e) => setTaxGst(e.target.value)}
                      style={{ width: "100%", padding: 8, fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
                    >
                      <option value="0">0% (Nil / Exempt)</option>
                      <option value="5">5% (Essential Skincare / Medical)</option>
                      <option value="12">12% (Standard Formulations)</option>
                      <option value="18">18% (Clinical & Cosmetic standard)</option>
                      <option value="28">28% (Luxury items)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
                      HSN Code (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 330499"
                      value={taxHsn}
                      onChange={(e) => setTaxHsn(e.target.value)}
                      style={{ width: "100%", padding: 8, fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={() => setActiveModal(null)}
                    style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={() => {
                      const gstRate = parseFloat(taxGst);
                      const updates: Record<string, unknown> = { gstRate };
                      if (taxHsn.trim()) updates.hsn = taxHsn.trim();
                      handleExecuteBulkUpdate(updates, `GST ${gstRate}%${taxHsn ? ` (HSN: ${taxHsn})` : ""}`);
                    }}
                    style={{
                      padding: "8px 18px",
                      background: "var(--purple, #2A0F3A)",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {isSubmitting ? "Applying…" : "Save Tax Settings"}
                  </button>
                </div>
              </div>
            )}

            {/* MODAL 4: INVENTORY & STOCK */}
            {activeModal === "stock" && (
              <div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#475569" }}>
                  Update inventory levels or threshold alerts:
                </p>
                <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
                      Inventory Action
                    </label>
                    <select
                      value={stockOp}
                      onChange={(e) => setStockOp(e.target.value as any)}
                      style={{ width: "100%", padding: 8, fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
                    >
                      <option value="add">Add Units to Current Stock (+)</option>
                      <option value="subtract">Subtract Units from Current Stock (-)</option>
                      <option value="set_value">Set Exact Stock Level</option>
                      <option value="set_threshold">Set Low Stock Alert Threshold</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
                      Units Quantity
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 25"
                      value={stockVal}
                      onChange={(e) => setStockVal(e.target.value)}
                      style={{ width: "100%", padding: 8, fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={() => setActiveModal(null)}
                    style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isSubmitting || !stockVal}
                    onClick={() => {
                      const numVal = parseInt(stockVal, 10);
                      if (isNaN(numVal) || numVal < 0) {
                        alert("Please enter a valid non-negative integer.");
                        return;
                      }

                      if (stockOp === "set_value") {
                        handleExecuteBulkUpdate({ stock: numVal }, `Set stock to ${numVal}`);
                      } else if (stockOp === "set_threshold") {
                        handleExecuteBulkUpdate({ lowStockThreshold: numVal }, `Set low stock threshold to ${numVal}`);
                      } else {
                        handleExecuteBulkUpdate(
                          { stockAdjustment: { operation: stockOp, value: numVal } },
                          `Stock ${stockOp} (${numVal})`
                        );
                      }
                    }}
                    style={{
                      padding: "8px 18px",
                      background: "var(--purple, #2A0F3A)",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {isSubmitting ? "Applying…" : "Apply Stock Update"}
                  </button>
                </div>
              </div>
            )}

            {/* MODAL 5: CATEGORY REASSIGNMENT */}
            {activeModal === "category" && (
              <div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#475569" }}>
                  Move selected products to a different category:
                </p>
                <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
                      Choose Existing Category
                    </label>
                    <select
                      value={targetCategory}
                      onChange={(e) => {
                        setTargetCategory(e.target.value);
                        setCustomCategory("");
                      }}
                      style={{ width: "100%", padding: 8, fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
                    >
                      {availableCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__custom__">+ Enter New Category…</option>
                    </select>
                  </div>

                  {targetCategory === "__custom__" && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
                        New Category Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Suncare or Anti-Aging"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        style={{ width: "100%", padding: 8, fontSize: 12, borderRadius: 4, border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={() => setActiveModal(null)}
                    style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={() => {
                      const finalCat = targetCategory === "__custom__" ? customCategory.trim() : targetCategory;
                      if (!finalCat) {
                        alert("Please select or enter a valid category name.");
                        return;
                      }
                      handleExecuteBulkUpdate({ category: finalCat }, `Move to category '${finalCat}'`);
                    }}
                    style={{
                      padding: "8px 18px",
                      background: "var(--purple, #2A0F3A)",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {isSubmitting ? "Applying…" : "Reassign Category"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
