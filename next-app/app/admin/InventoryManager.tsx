"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { InventoryOverview, InventoryItemView } from "@/lib/commerce/inventory";
import type { InventoryTransaction, InventoryMovementType } from "@/lib/commerce/types";

export default function InventoryManager() {
  const [activeSubTab, setActiveSubTab] = useState<"inventory" | "ledger">("inventory");
  const [overview, setOverview] = useState<InventoryOverview | null>(null);
  const [items, setItems] = useState<InventoryItemView[]>([]);
  const [ledger, setLedger] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Adjustment Modal State
  const [selectedItem, setSelectedItem] = useState<InventoryItemView | null>(null);
  const [adjustType, setAdjustType] = useState<InventoryMovementType>("RESTOCK");
  const [adjustMode, setAdjustMode] = useState<"delta" | "exact">("delta");
  const [adjustQuantity, setAdjustQuantity] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>("Supplier Restock");
  const [adjustNotes, setAdjustNotes] = useState<string>("");
  const [adjusting, setAdjusting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setOverview(d.overview);
        setItems(d.items || []);
      }
    } catch (e) {
      console.error("Failed to load inventory:", e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const loadLedger = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/inventory/ledger?limit=150");
      if (res.ok) {
        const d = await res.json();
        setLedger(d.ledger || []);
      }
    } catch (e) {
      console.error("Failed to load ledger:", e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchInv = async () => {
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (statusFilter !== "all") params.set("status", statusFilter);

        const res = await fetch(`/api/admin/inventory?${params.toString()}`);
        if (res.ok && !cancelled) {
          const d = await res.json();
          setOverview(d.overview);
          setItems(d.items || []);
        }
      } catch (e) {
        console.error("Failed to load inventory:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchInv();
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter]);

  useEffect(() => {
    if (activeSubTab !== "ledger") return;
    let cancelled = false;
    const fetchLedgerData = async () => {
      try {
        const res = await fetch("/api/admin/inventory/ledger?limit=150");
        if (res.ok && !cancelled) {
          const d = await res.json();
          setLedger(d.ledger || []);
        }
      } catch (e) {
        console.error("Failed to load ledger:", e);
      }
    };
    fetchLedgerData();
    return () => {
      cancelled = true;
    };
  }, [activeSubTab]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setAdjusting(true);
    setActionMessage(null);

    try {
      const payload: Record<string, unknown> = {
        productId: selectedItem.slug,
        type: adjustType,
        reason: adjustReason,
        notes: adjustNotes.trim() || undefined,
      };

      if (adjustMode === "exact") {
        payload.newStock = Number(adjustQuantity);
      } else {
        const sign = adjustType === "DAMAGED" || adjustType === "EXPIRED" || adjustType === "SAMPLE" || adjustType === "QUARANTINE" || adjustType === "MANUAL_DECREASE" ? -1 : 1;
        payload.delta = sign * Math.abs(Number(adjustQuantity));
      }

      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error || "Adjustment failed.");
      }

      setActionMessage({ type: "success", text: `Stock updated for ${selectedItem.name}. New Stock: ${d.newStock}` });
      setSelectedItem(null);
      setAdjustQuantity(10);
      setAdjustNotes("");
      loadData();
      if (activeSubTab === "ledger") loadLedger();
    } catch (err: unknown) {
      setActionMessage({ type: "error", text: err instanceof Error ? err.message : "Error adjusting stock." });
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ─── HEADER & TAB TOGGLE ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>📦</span>
            <h2 style={{ font: "22px var(--font-display)", color: "var(--purple, #2A0F3A)", margin: 0 }}>
              Inventory Control Center
            </h2>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", background: "#e0f2fe", color: "#0369a1", borderRadius: 12, textTransform: "uppercase" }}>
              Authoritative Ledger
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted, #666)" }}>
            Centralized stock lifecycle, multi-SKU inventory tracking, real-time customer scarcity previews, and cGMP compliance ledger.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, background: "#f1ede7", padding: 4, borderRadius: 6 }}>
          <button
            type="button"
            onClick={() => setActiveSubTab("inventory")}
            style={{
              padding: "6px 16px",
              borderRadius: 4,
              border: "none",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              background: activeSubTab === "inventory" ? "#2A0F3A" : "transparent",
              color: activeSubTab === "inventory" ? "#fff" : "#2A0F3A",
              transition: "all 0.15s ease",
            }}
          >
            Catalog Inventory
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("ledger")}
            style={{
              padding: "6px 16px",
              borderRadius: 4,
              border: "none",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              background: activeSubTab === "ledger" ? "#2A0F3A" : "transparent",
              color: activeSubTab === "ledger" ? "#fff" : "#2A0F3A",
              transition: "all 0.15s ease",
            }}
          >
            Audit Ledger History
          </button>
        </div>
      </div>

      {/* ─── ACTION MESSAGE BANNER ─── */}
      {actionMessage && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 6,
            background: actionMessage.type === "success" ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${actionMessage.type === "success" ? "#a7f3d0" : "#fecaca"}`,
            color: actionMessage.type === "success" ? "#065f46" : "#991b1b",
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── KPI METRICS CARDS ─── */}
      {overview && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <div style={{ padding: "16px", background: "#fff", border: "1px solid var(--line, rgba(42, 15, 58, 0.12))", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".05em" }}>Total Products</span>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#2A0F3A", marginTop: 4 }}>{overview.totalProducts}</div>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>{overview.totalSkus} Active SKUs</span>
          </div>

          <div style={{ padding: "16px", background: "#fff", border: "1px solid var(--line, rgba(42, 15, 58, 0.12))", borderRadius: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: ".05em" }}>In Stock</span>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#15803d", marginTop: 4 }}>{overview.inStockCount}</div>
            <span style={{ fontSize: 11, color: "#86efac" }}>Healthy levels</span>
          </div>

          <div style={{ padding: "16px", background: "#fff", border: "1px solid var(--line, rgba(42, 15, 58, 0.12))", borderRadius: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: ".05em" }}>Low Stock</span>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#d97706", marginTop: 4 }}>{overview.lowStockCount}</div>
            <span style={{ fontSize: 11, color: "#fcd34d" }}>≤ Threshold limit</span>
          </div>

          <div style={{ padding: "16px", background: "#fff", border: "1px solid var(--line, rgba(42, 15, 58, 0.12))", borderRadius: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", textTransform: "uppercase", letterSpacing: ".05em" }}>Out of Stock</span>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#dc2626", marginTop: 4 }}>{overview.outOfStockCount}</div>
            <span style={{ fontSize: 11, color: "#fca5a5" }}>Action required</span>
          </div>

          <div style={{ padding: "16px", background: "#fff", border: "1px solid var(--line, rgba(42, 15, 58, 0.12))", borderRadius: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", letterSpacing: ".05em" }}>Pre-Orders</span>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0284c7", marginTop: 4 }}>{overview.preorderActiveCount}</div>
            <span style={{ fontSize: 11, color: "#7dd3fc" }}>Active pre-orders</span>
          </div>

          <div style={{ padding: "16px", background: "#fff", border: "1px solid var(--line, rgba(42, 15, 58, 0.12))", borderRadius: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em" }}>Inventory Value</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#2A0F3A", marginTop: 4 }}>₹{overview.totalValuation.toLocaleString("en-IN")}</div>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>Physical inventory value</span>
          </div>
        </div>
      )}

      {/* ─── TAB 1: CATALOG INVENTORY ─── */}
      {activeSubTab === "inventory" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Filters Bar */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", background: "#fff", padding: "14px 18px", borderRadius: 8, border: "1px solid var(--line)" }}>
            <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search formulations by name, SKU, slug, or category..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 13,
                  border: "1px solid var(--line)",
                  borderRadius: 4,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  fontSize: 13,
                  border: "1px solid var(--line)",
                  borderRadius: 4,
                  background: "#fff",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="all">All Formulations</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock (≤ Threshold)</option>
                <option value="out_of_stock">Out of Stock (0 units)</option>
                <option value="preorder">Pre-Order Enabled</option>
              </select>
            </div>

            <button
              type="button"
              onClick={loadData}
              style={{
                padding: "8px 16px",
                background: "var(--purple, #2A0F3A)",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Apply Filter
            </button>
          </div>

          {/* Inventory Table */}
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid var(--line)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#faf8f5", borderBottom: "1px solid var(--line)", color: "#2A0F3A" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Formulation & SKU</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Category</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Price</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "center" }}>Stock Qty</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "center" }}>Threshold</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Status</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Truthful Customer Scarcity Preview</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "center" }}>Waitlist</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#64748B" }}>
                      Loading inventory records…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#64748B" }}>
                      No formulations match the current search or status filter.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isOos = item.stock <= 0;
                    const isLow = !isOos && item.stock <= item.lowStockThreshold;

                    return (
                      <tr key={item.productId} style={{ borderBottom: "1px solid rgba(42, 15, 58, 0.08)", transition: "background 0.15s" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{ width: 38, height: 38, objectFit: "cover", borderRadius: 4, border: "1px solid var(--line)" }}
                            />
                            <div>
                              <b style={{ color: "#2A0F3A", display: "block" }}>{item.name}</b>
                              <span style={{ fontSize: 11, color: "#64748B", fontFamily: "monospace" }}>SKU: {item.sku}</span>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "12px 16px", color: "#475569" }}>
                          {item.category}
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "#2A0F3A" }}>
                          ₹{item.price.toLocaleString("en-IN")}
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 10px",
                              borderRadius: 12,
                              fontWeight: 700,
                              fontSize: 13,
                              background: isOos ? "#fef2f2" : isLow ? "#fffbeb" : "#f0fdf4",
                              color: isOos ? "#dc2626" : isLow ? "#b45309" : "#15803d",
                              border: `1px solid ${isOos ? "#fca5a5" : isLow ? "#fcd34d" : "#86efac"}`,
                            }}
                          >
                            {item.stock}
                          </span>
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "center", color: "#64748B" }}>
                          {item.lowStockThreshold}
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          {item.calculatedStatus === "out_of_stock" && (
                            <span style={{ padding: "2px 8px", background: "#fef2f2", color: "#dc2626", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                              OUT OF STOCK
                            </span>
                          )}
                          {item.calculatedStatus === "low_stock" && (
                            <span style={{ padding: "2px 8px", background: "#fffbeb", color: "#b45309", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                              LOW STOCK
                            </span>
                          )}
                          {item.calculatedStatus === "in_stock" && (
                            <span style={{ padding: "2px 8px", background: "#f0fdf4", color: "#15803d", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                              IN STOCK
                            </span>
                          )}
                          {item.calculatedStatus === "preorder" && (
                            <span style={{ padding: "2px 8px", background: "#f0f9ff", color: "#0284c7", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                              PRE-ORDER
                            </span>
                          )}
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 12, color: isLow ? "#b45309" : isOos ? "#64748B" : "#15803d", fontWeight: 500 }}>
                            {item.scarcityMessage}
                          </span>
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          {item.subscriberCount > 0 ? (
                            <span style={{ padding: "2px 8px", background: "#f3e8ff", color: "#7e22ce", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                              {item.subscriberCount} waiting
                            </span>
                          ) : (
                            <span style={{ color: "#94A3B8", fontSize: 12 }}>—</span>
                          )}
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedItem(item)}
                            style={{
                              padding: "6px 12px",
                              background: "#fff",
                              border: "1px solid var(--purple, #2A0F3A)",
                              color: "var(--purple, #2A0F3A)",
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            Adjust Stock
                          </button>
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

      {/* ─── TAB 2: AUDIT LEDGER ─── */}
      {activeSubTab === "ledger" && (
        <div style={{ background: "#fff", borderRadius: 8, border: "1px solid var(--line)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#faf8f5", borderBottom: "1px solid var(--line)", color: "#2A0F3A" }}>
                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Timestamp</th>
                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Product / SKU</th>
                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Movement Type</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "center" }}>Delta</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "center" }}>Before → After</th>
                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Reason / Notes</th>
                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Actor</th>
                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Order Ref</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#64748B" }}>
                    No inventory movements recorded yet. Movements will record here automatically.
                  </td>
                </tr>
              ) : (
                ledger.map((tx) => {
                  const isPositive = tx.quantity > 0;
                  return (
                    <tr key={tx.id} style={{ borderBottom: "1px solid rgba(42, 15, 58, 0.08)" }}>
                      <td style={{ padding: "12px 16px", color: "#64748B", whiteSpace: "nowrap", fontSize: 12 }}>
                        {new Date(tx.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" })}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <b style={{ color: "#2A0F3A", display: "block" }}>{tx.productName || tx.productId}</b>
                        <span style={{ fontSize: 11, color: "#64748B", fontFamily: "monospace" }}>{tx.sku}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            background:
                              tx.type === "RESTOCK" || tx.type === "MANUAL_INCREASE"
                                ? "#ecfdf5"
                                : tx.type === "ORDER"
                                ? "#eff6ff"
                                : tx.type === "DAMAGED" || tx.type === "EXPIRED"
                                ? "#fef2f2"
                                : "#faf5ff",
                            color:
                              tx.type === "RESTOCK" || tx.type === "MANUAL_INCREASE"
                                ? "#065f46"
                                : tx.type === "ORDER"
                                ? "#1d4ed8"
                                : tx.type === "DAMAGED" || tx.type === "EXPIRED"
                                ? "#991b1b"
                                : "#6b21a8",
                          }}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, color: isPositive ? "#15803d" : "#dc2626" }}>
                        {isPositive ? `+${tx.quantity}` : tx.quantity}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", color: "#475569" }}>
                        {tx.qtyBefore} → <b>{tx.qtyAfter}</b>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        {tx.reason}
                        {tx.notes && <span style={{ display: "block", fontSize: 11, color: "#64748B", fontStyle: "italic" }}>Note: {tx.notes}</span>}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748B", fontSize: 12 }}>
                        {tx.actor}
                      </td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "#2A0F3A" }}>
                        {tx.orderId || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MODAL: MANUAL STOCK ADJUSTMENT ─── */}
      {selectedItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              maxWidth: 500,
              width: "100%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              padding: 24,
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: 0 }}>
                Adjust Stock: {selectedItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748B" }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "10px 14px", background: "#FAF8F5", borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
              <span>Current Physical Stock: </span>
              <b style={{ color: "#2A0F3A", fontSize: 15 }}>{selectedItem.stock} units</b>
              <span style={{ color: "#64748B", marginLeft: 8 }}>(Threshold: {selectedItem.lowStockThreshold})</span>
            </div>

            <form onSubmit={handleAdjustSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setAdjustMode("delta")}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid var(--line)",
                    background: adjustMode === "delta" ? "var(--purple)" : "#fff",
                    color: adjustMode === "delta" ? "#fff" : "var(--purple)",
                  }}
                >
                  +/- Relative Change
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode("exact")}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid var(--line)",
                    background: adjustMode === "exact" ? "var(--purple)" : "#fff",
                    color: adjustMode === "exact" ? "#fff" : "var(--purple)",
                  }}
                >
                  = Exact Count Correction
                </button>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                  Reason Category (Required for audit trail)
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => {
                    const val = e.target.value as InventoryMovementType;
                    setAdjustType(val);
                    if (val === "RESTOCK") setAdjustReason("Supplier Delivery Restock");
                    else if (val === "DAMAGED") setAdjustReason("Damaged in Warehouse Inspection");
                    else if (val === "EXPIRED") setAdjustReason("Expired Batch Segregation");
                    else if (val === "SAMPLE") setAdjustReason("Physician Clinical Sample Dispatched");
                    else if (val === "QUARANTINE") setAdjustReason("Quarantined Pending QC Inspection");
                    else setAdjustReason("Physical Stock Count Correction");
                  }}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid var(--line)", fontSize: 13 }}
                >
                  <option value="RESTOCK">📦 Restock / New Batch Inward (+)</option>
                  <option value="STOCK_CORRECTION">⚖️ Physical Count Correction (=)</option>
                  <option value="DAMAGED">⚠️ Damaged / Defective (-)</option>
                  <option value="EXPIRED">⌛ Expired Batch (-)</option>
                  <option value="QUARANTINE">🛡️ Quarantine / QC Hold (-)</option>
                  <option value="SAMPLE">⚕️ Physician Sample Dispatch (-)</option>
                  <option value="MANUAL_INCREASE">➕ Manual Increase (+)</option>
                  <option value="MANUAL_DECREASE">➖ Manual Decrease (-)</option>
                  <option value="OTHER">📝 Other Audit Adjustment</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                  {adjustMode === "exact" ? "New Absolute Stock Quantity" : "Quantity to Add / Deduct"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid var(--line)", fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                  Audit Reason Description (Mandatory)
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g., Batch B-2026-09 received from certified lab"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid var(--line)", fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                  Optional Reference / Inspection Notes
                </label>
                <textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  rows={2}
                  placeholder="PO #, Batch Certificate ID, or duty pharmacist notes..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid var(--line)", fontSize: 13, resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  style={{
                    padding: "8px 16px",
                    background: "#fff",
                    border: "1px solid var(--line)",
                    borderRadius: 4,
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  style={{
                    padding: "8px 20px",
                    background: "var(--purple)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {adjusting ? "Updating…" : "Commit Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
