"use client";

import { useState, useRef, useMemo } from "react";
import { Badge } from "./shared";
import OrderDetailPanel from "./OrderDetailPanel";
import { ORDER_VALID_TRANSITIONS, STANDARD_REJECTION_REASONS } from "@/lib/commerce/order-constants";

/* ═══════════════════════════════════════════════════════════════
   OrderManager — Comprehensive Admin Order Management
   With multi-filter (status, payment, date, state), bulk checkboxes,
   mandatory rejection reason modals, and state machine enforcement.
   ═══════════════════════════════════════════════════════════════ */

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rejected",
  "refunded",
] as const;

export default function OrderManager({
  orders,
  onUpdate,
}: {
  orders: Record<string, unknown>[];
  onUpdate: () => void;
}) {
  const [filter, setFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Rejection modal state (for single order)
  const [rejectingOrder, setRejectingOrder] = useState<Record<string, unknown> | null>(null);
  const [rejectReason, setRejectReason] = useState<string>(STANDARD_REJECTION_REASONS[0]);
  const [customRejectNote, setCustomRejectNote] = useState("");
  const [rejectError, setRejectError] = useState("");

  // Bulk confirmation modals
  const [showBulkAcceptModal, setShowBulkAcceptModal] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState<string>(STANDARD_REJECTION_REASONS[0]);
  const [bulkCustomRejectNote, setBulkCustomRejectNote] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const perPage = 20;

  // Extract unique states from order shipping addresses for the state filter
  const uniqueStates = useMemo(() => {
    const s = new Set<string>();
    orders.forEach((o) => {
      const ship = o.shipping as Record<string, unknown> | undefined;
      if (ship?.state && typeof ship.state === "string") {
        s.add(ship.state.trim());
      }
    });
    return Array.from(s).sort();
  }, [orders]);

  // Multi-field filtered list
  const filtered = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter((o) => {
      // 1. Status Filter
      if (filter !== "all" && String(o.status || "pending") !== filter) return false;

      // 2. Payment Filter
      if (paymentFilter !== "all" && String(o.paymentStatus || "pending") !== paymentFilter) return false;

      // 3. Date Preset Filter
      if (dateFilter !== "all" && o.createdAt) {
        const orderTime = new Date(String(o.createdAt)).getTime();
        if (dateFilter === "today" && orderTime < startOfToday) return false;
        if (dateFilter === "7days" && orderTime < sevenDaysAgo) return false;
        if (dateFilter === "month" && orderTime < startOfMonth) return false;
      }

      // 4. Shipping State Filter
      if (stateFilter !== "all") {
        const ship = o.shipping as Record<string, unknown> | undefined;
        if (String(ship?.state || "").trim() !== stateFilter) return false;
      }

      // 5. Search Query (ID, Customer Name, Email, Phone, City, Tracking)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const id = String(o.id || "").toLowerCase();
        const name = String(o.customerName || (o.shipping as Record<string, unknown>)?.fullName || "").toLowerCase();
        const email = String(o.email || (o.shipping as Record<string, unknown>)?.email || "").toLowerCase();
        const phone = String(o.phone || (o.shipping as Record<string, unknown>)?.phone || "").toLowerCase();
        const city = String((o.shipping as Record<string, unknown>)?.city || "").toLowerCase();
        const tracking = String(o.trackingCode || "").toLowerCase();

        if (
          !id.includes(q) &&
          !name.includes(q) &&
          !email.includes(q) &&
          !phone.includes(q) &&
          !city.includes(q) &&
          !tracking.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [orders, filter, paymentFilter, dateFilter, stateFilter, searchQuery]);

  // Reset page when filter changes
  const prevFilterRef = useRef({ filter, paymentFilter, dateFilter, stateFilter, searchQuery });
  if (
    prevFilterRef.current.filter !== filter ||
    prevFilterRef.current.paymentFilter !== paymentFilter ||
    prevFilterRef.current.dateFilter !== dateFilter ||
    prevFilterRef.current.stateFilter !== stateFilter ||
    prevFilterRef.current.searchQuery !== searchQuery
  ) {
    setCurrentPage(0);
    prevFilterRef.current = { filter, paymentFilter, dateFilter, stateFilter, searchQuery };
  }

  // Selection handlers
  const toggleSelectOrder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filtered.map((o) => String(o.id)));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((o) => selectedIds.has(String(o.id)));
  const someFilteredSelected = filtered.some((o) => selectedIds.has(String(o.id)));

  // Single Order Status Update
  const handleUpdateStatus = async (id: string, status: string, note?: string) => {
    try {
      const body: Record<string, unknown> = { status };
      if (note) body.note = note;
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate();
      } else {
        alert(data.error || "Failed to update order status.");
      }
    } catch {
      alert("Network error updating order status.");
    }
  };

  // Single Order Rejection
  const handleConfirmSingleReject = async () => {
    if (!rejectingOrder) return;
    setRejectError("");

    if (!rejectReason) {
      setRejectError("Please select a rejection reason.");
      return;
    }
    if (rejectReason === "Other" && !customRejectNote.trim()) {
      setRejectError("Please enter an explanation for 'Other'.");
      return;
    }

    const note =
      rejectReason === "Other"
        ? `Other: ${customRejectNote.trim()}`
        : customRejectNote.trim()
        ? `${rejectReason} (${customRejectNote.trim()})`
        : rejectReason;

    setIsProcessing(true);
    await handleUpdateStatus(String(rejectingOrder.id), "rejected", note);
    setIsProcessing(false);
    setRejectingOrder(null);
    setRejectReason(STANDARD_REJECTION_REASONS[0]);
    setCustomRejectNote("");
  };

  // Bulk Accept Action
  const handleExecuteBulkAccept = async () => {
    setIsProcessing(true);
    setBulkError("");
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: Array.from(selectedIds),
          action: "accept",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowBulkAcceptModal(false);
        setSelectedIds(new Set());
        onUpdate();
      } else {
        setBulkError(data.error || "Some orders could not be accepted.");
      }
    } catch {
      setBulkError("Network error during bulk accept.");
    }
    setIsProcessing(false);
  };

  // Bulk Reject Action
  const handleExecuteBulkReject = async () => {
    setBulkError("");
    if (!bulkRejectReason) {
      setBulkError("Please select a mandatory rejection reason.");
      return;
    }
    if (bulkRejectReason === "Other" && !bulkCustomRejectNote.trim()) {
      setBulkError("Please specify the custom reason for 'Other'.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: Array.from(selectedIds),
          action: "reject",
          reason: bulkRejectReason,
          customNote: bulkCustomRejectNote.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowBulkRejectModal(false);
        setSelectedIds(new Set());
        setBulkRejectReason(STANDARD_REJECTION_REASONS[0]);
        setBulkCustomRejectNote("");
        onUpdate();
      } else {
        setBulkError(data.error || "Some orders could not be rejected.");
      }
    } catch {
      setBulkError("Network error during bulk rejection.");
    }
    setIsProcessing(false);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* ─── Search & Multi-Filters Toolbar ─── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--line, #e6e4ea)",
          borderRadius: 8,
          padding: "16px",
          marginBottom: 16,
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            placeholder="🔍 Search order ID, customer name, email, phone, city, AWB…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: "1 1 280px",
              padding: "9px 12px",
              borderRadius: 6,
              border: "1px solid var(--line, #ccc)",
              fontSize: 12,
            }}
          />

          {/* Payment Status Dropdown */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 6, border: "1px solid var(--line, #ccc)", fontSize: 12 }}
          >
            <option value="all">All Payment Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="cod_pending">COD Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Date Filter Dropdown */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 6, border: "1px solid var(--line, #ccc)", fontSize: 12 }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="month">This Month</option>
          </select>

          {/* State Filter Dropdown */}
          {uniqueStates.length > 0 && (
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: 6, border: "1px solid var(--line, #ccc)", fontSize: 12 }}
            >
              <option value="all">All Delivery States ({uniqueStates.length})</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          )}

          <span style={{ fontSize: 12, color: "var(--muted, #666)", fontWeight: 600 }}>
            {filtered.length} order{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", paddingTop: 4 }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "5px 12px",
              fontSize: 11,
              borderRadius: 20,
              border: filter === "all" ? "2px solid var(--purple, #240e35)" : "1px solid #ddd",
              background: filter === "all" ? "var(--purple, #240e35)" : "#fff",
              color: filter === "all" ? "#fff" : "var(--ink, #333)",
              cursor: "pointer",
              fontWeight: filter === "all" ? 700 : 500,
            }}
          >
            All ({orders.length})
          </button>
          {ORDER_STATUSES.map((s) => {
            const count = orders.filter((o) => String(o.status || "pending") === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: "5px 12px",
                  fontSize: 11,
                  borderRadius: 20,
                  border: filter === s ? "2px solid var(--purple, #240e35)" : "1px solid #ddd",
                  background: filter === s ? "var(--purple, #240e35)" : "#fff",
                  color: filter === s ? "#fff" : "var(--ink, #333)",
                  cursor: "pointer",
                  fontWeight: filter === s ? 700 : 500,
                  textTransform: "capitalize",
                }}
              >
                {s.replace(/_/g, " ")} {count > 0 && <span style={{ opacity: 0.75 }}>({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Floating Bulk Action Bar (Appears when items are selected) ─── */}
      {selectedIds.size > 0 && (
        <div
          style={{
            position: "sticky",
            top: 10,
            zIndex: 50,
            background: "var(--purple, #240e35)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 8,
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            animation: "qcSlideDown 0.2s ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              ✓ {selectedIds.size} order{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "#fff",
                padding: "4px 10px",
                borderRadius: 4,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Deselect All
            </button>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowBulkAcceptModal(true)}
              style={{
                padding: "7px 16px",
                background: "#2e7d32",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>✓</span> Accept Selected ({selectedIds.size})
            </button>
            <button
              onClick={() => setShowBulkRejectModal(true)}
              style={{
                padding: "7px 16px",
                background: "#c62828",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>✕</span> Reject Selected ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      {/* ─── Table Header with Select-All Checkbox ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "36px 1.4fr 0.8fr 0.8fr 0.8fr 1.2fr 1.6fr",
          gap: 10,
          padding: "10px 14px",
          background: "#eceaf0",
          borderRadius: "6px 6px 0 0",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--purple, #240e35)",
          alignItems: "center",
        }}
      >
        <div>
          <input
            type="checkbox"
            checked={allFilteredSelected}
            ref={(input) => {
              if (input) input.indeterminate = !allFilteredSelected && someFilteredSelected;
            }}
            onChange={handleSelectAll}
            style={{ width: 16, height: 16, cursor: "pointer" }}
            title="Select / Deselect all filtered orders"
          />
        </div>
        <div>Order & Date</div>
        <div>Total</div>
        <div>Order Status</div>
        <div>Payment</div>
        <div>Customer / City</div>
        <div style={{ textAlign: "right" }}>Actions</div>
      </div>

      {/* ─── Order Rows ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filtered.length === 0 && (
          <div style={{ color: "var(--muted, #666)", fontSize: 13, textAlign: "center", padding: 40, background: "#fff" }}>
            No orders match the selected filters.
          </div>
        )}

        {filtered.slice(currentPage * perPage, (currentPage + 1) * perPage).map((order) => {
          const id = String(order.id);
          const isExpanded = expandedId === id;
          const isSelected = selectedIds.has(id);
          const status = String(order.status || "pending");
          const validNextTransitions = ORDER_VALID_TRANSITIONS[status] || [];
          const shipping = order.shipping as Record<string, unknown> | undefined;

          return (
            <div
              key={id}
              style={{
                border: `1px solid ${isSelected ? "var(--purple, #240e35)" : "var(--line, #e6e4ea)"}`,
                borderRadius: 4,
                background: isSelected ? "#fcfaff" : "#fff",
                overflow: "hidden",
                transition: "border-color 0.15s",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 1.4fr 0.8fr 0.8fr 0.8fr 1.2fr 1.6fr",
                  gap: 10,
                  padding: "10px 14px",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => setExpandedId(isExpanded ? null : id)}
              >
                {/* Row Selection Checkbox */}
                <div onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => toggleSelectOrder(id, e as unknown as React.MouseEvent)}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                </div>

                {/* Order ID & Date */}
                <div>
                  <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--purple, #240e35)" }}>
                    #{id.slice(0, 16)}
                  </span>
                  {order.createdAt ? (
                    <span style={{ display: "block", fontSize: 10, color: "var(--muted, #666)", marginTop: 2 }}>
                      {new Date(String(order.createdAt)).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  ) : null}
                </div>

                {/* Order Total */}
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  ₹{Number(order.total || 0).toLocaleString("en-IN")}
                </div>

                {/* Order Status Badge */}
                <div>
                  <Badge status={status} />
                </div>

                {/* Payment Status Badge */}
                <div>
                  <Badge status={String(order.paymentStatus || "pending")} />
                </div>

                {/* Customer Name & City */}
                <div style={{ fontSize: 11, color: "var(--ink, #333)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <b style={{ display: "block" }}>{String(order.customerName || shipping?.fullName || order.email || "—")}</b>
                  <span style={{ color: "var(--muted, #666)", fontSize: 10 }}>
                    {shipping?.city ? `${shipping.city}, ${shipping.state || ""}` : "No address"}
                  </span>
                </div>

                {/* Actions & State Machine Transition Buttons */}
                <div style={{ display: "flex", gap: 5, justifyContent: "flex-end", flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
                  {/* Print Shortcut Menu */}
                  <a
                    href={`/admin/orders/${encodeURIComponent(id)}/print/shipping-label`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "4px 8px",
                      fontSize: 10,
                      background: "#f0f0f0",
                      color: "#333",
                      borderRadius: 3,
                      textDecoration: "none",
                      border: "1px solid #ccc",
                      fontWeight: 600,
                    }}
                    title="Print 4x6 / A4 Shipping Label"
                  >
                    🏷️ Label
                  </a>

                  {/* State Machine Action Buttons */}
                  {validNextTransitions.includes("confirmed") && (
                    <button
                      onClick={() => handleUpdateStatus(id, "confirmed")}
                      style={{
                        padding: "4px 10px",
                        fontSize: 10,
                        fontWeight: 700,
                        background: "#e8f5e9",
                        color: "#2e7d32",
                        border: "1px solid #c8e6c9",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                    >
                      ✓ Accept
                    </button>
                  )}

                  {validNextTransitions.includes("rejected") && (
                    <button
                      onClick={() => {
                        setRejectingOrder(order);
                        setRejectReason(STANDARD_REJECTION_REASONS[0]);
                        setCustomRejectNote("");
                        setRejectError("");
                      }}
                      style={{
                        padding: "4px 10px",
                        fontSize: 10,
                        fontWeight: 700,
                        background: "#ffebee",
                        color: "#c62828",
                        border: "1px solid #ffcdd2",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                    >
                      ✕ Reject
                    </button>
                  )}

                  {validNextTransitions.includes("processing") && (
                    <button
                      onClick={() => handleUpdateStatus(id, "processing")}
                      style={{
                        padding: "4px 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        background: "#e3f2fd",
                        color: "#1565c0",
                        border: "1px solid #bbdefb",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                    >
                      ⚙ Process
                    </button>
                  )}

                  {validNextTransitions.includes("packed") && (
                    <button
                      onClick={() => handleUpdateStatus(id, "packed")}
                      style={{
                        padding: "4px 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        background: "#e0f2f1",
                        color: "#00695c",
                        border: "1px solid #b2dfdb",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                    >
                      📦 Pack
                    </button>
                  )}

                  {validNextTransitions.includes("shipped") && (
                    <button
                      onClick={() => handleUpdateStatus(id, "shipped")}
                      style={{
                        padding: "4px 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        background: "#ede7f6",
                        color: "#512da8",
                        border: "1px solid #d1c4e9",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                    >
                      🚚 Ship
                    </button>
                  )}

                  {validNextTransitions.includes("out_for_delivery") && (
                    <button
                      onClick={() => handleUpdateStatus(id, "out_for_delivery")}
                      style={{
                        padding: "4px 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        background: "#fff3e0",
                        color: "#e65100",
                        border: "1px solid #ffe0b2",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                    >
                      🛵 Out
                    </button>
                  )}

                  {validNextTransitions.includes("delivered") && (
                    <button
                      onClick={() => handleUpdateStatus(id, "delivered")}
                      style={{
                        padding: "4px 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        background: "#e8f5e9",
                        color: "#1b5e20",
                        border: "1px solid #a5d6a7",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                    >
                      ✓ Delivered
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Order Detail Panel */}
              {isExpanded && <OrderDetailPanel orderId={id} onClose={() => setExpandedId(null)} onRefresh={onUpdate} />}
            </div>
          );
        })}
      </div>

      {/* ─── Pagination ─── */}
      {filtered.length > perPage && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "12px 0", borderTop: "1px solid var(--line, #e6e4ea)" }}>
          <span style={{ fontSize: 12, color: "var(--muted, #666)" }}>
            Showing {currentPage * perPage + 1}–{Math.min((currentPage + 1) * perPage, filtered.length)} of {filtered.length} orders
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
              style={{
                padding: "5px 12px",
                fontSize: 11,
                border: "1px solid var(--line, #ccc)",
                background: currentPage === 0 ? "#f5f5f5" : "#fff",
                cursor: currentPage === 0 ? "not-allowed" : "pointer",
                borderRadius: 4,
              }}
            >
              ← Prev
            </button>
            <button
              disabled={currentPage >= Math.ceil(filtered.length / perPage) - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{
                padding: "5px 12px",
                fontSize: 11,
                border: "1px solid var(--line, #ccc)",
                background: currentPage >= Math.ceil(filtered.length / perPage) - 1 ? "#f5f5f5" : "#fff",
                cursor: currentPage >= Math.ceil(filtered.length / perPage) - 1 ? "not-allowed" : "pointer",
                borderRadius: 4,
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: Individual Order Rejection Modal (Mandatory Reason) ─── */}
      {rejectingOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setRejectingOrder(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: 24,
              maxWidth: 480,
              width: "90%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 10px", fontSize: 18, color: "#c62828" }}>
              Reject Order #{String(rejectingOrder.id).slice(0, 16)}
            </h3>
            <p style={{ fontSize: 12, color: "#555", margin: "0 0 16px", lineHeight: 1.5 }}>
              Under pharmaceutical compliance, a specific rejection reason is mandatory and will be recorded in the immutable audit log.
            </p>

            {rejectError && (
              <p style={{ padding: "8px 12px", background: "#ffebee", color: "#c62828", fontSize: 12, borderRadius: 4, margin: "0 0 12px" }}>
                {rejectError}
              </p>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                Select Rejection Reason *
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #ccc", borderRadius: 4, fontSize: 13 }}
              >
                {STANDARD_REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {rejectReason === "Other" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                  Custom Explanation *
                </label>
                <textarea
                  value={customRejectNote}
                  onChange={(e) => setCustomRejectNote(e.target.value)}
                  placeholder="Explain why this order is being rejected (required)…"
                  rows={3}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: 4, fontSize: 12 }}
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setRejectingOrder(null)}
                style={{ padding: "8px 16px", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: 4, fontSize: 12, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSingleReject}
                disabled={isProcessing}
                style={{
                  padding: "8px 18px",
                  background: "#c62828",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isProcessing ? "wait" : "pointer",
                }}
              >
                {isProcessing ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Bulk Accept Confirmation Modal ─── */}
      {showBulkAcceptModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowBulkAcceptModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: 24,
              maxWidth: 460,
              width: "90%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 10px", fontSize: 18, color: "#2e7d32" }}>
              Confirm Bulk Order Acceptance
            </h3>
            <p style={{ fontSize: 13, color: "#444", lineHeight: 1.5, margin: "0 0 16px" }}>
              Are you sure you want to accept and move <b>{selectedIds.size} selected orders</b> to Confirmed status?
            </p>

            {bulkError && (
              <p style={{ padding: "8px 12px", background: "#ffebee", color: "#c62828", fontSize: 12, borderRadius: 4, margin: "0 0 12px" }}>
                {bulkError}
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setShowBulkAcceptModal(false)}
                style={{ padding: "8px 16px", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: 4, fontSize: 12, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBulkAccept}
                disabled={isProcessing}
                style={{
                  padding: "8px 18px",
                  background: "#2e7d32",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isProcessing ? "wait" : "pointer",
                }}
              >
                {isProcessing ? "Processing…" : `Accept ${selectedIds.size} Orders`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Bulk Reject Confirmation Modal (Mandatory Reason) ─── */}
      {showBulkRejectModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowBulkRejectModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: 24,
              maxWidth: 480,
              width: "90%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 10px", fontSize: 18, color: "#c62828" }}>
              Reject {selectedIds.size} Selected Orders
            </h3>
            <p style={{ fontSize: 12, color: "#555", margin: "0 0 16px", lineHeight: 1.5 }}>
              This will transition all <b>{selectedIds.size} orders</b> to Rejected status and release reserved stock back into inventory.
            </p>

            {bulkError && (
              <p style={{ padding: "8px 12px", background: "#ffebee", color: "#c62828", fontSize: 12, borderRadius: 4, margin: "0 0 12px" }}>
                {bulkError}
              </p>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                Mandatory Rejection Reason *
              </label>
              <select
                value={bulkRejectReason}
                onChange={(e) => setBulkRejectReason(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #ccc", borderRadius: 4, fontSize: 13 }}
              >
                {STANDARD_REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {bulkRejectReason === "Other" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                  Custom Reason Explanation *
                </label>
                <textarea
                  value={bulkCustomRejectNote}
                  onChange={(e) => setBulkCustomRejectNote(e.target.value)}
                  placeholder="Explain why these orders are being rejected…"
                  rows={3}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: 4, fontSize: 12 }}
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setShowBulkRejectModal(false)}
                style={{ padding: "8px 16px", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: 4, fontSize: 12, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBulkReject}
                disabled={isProcessing}
                style={{
                  padding: "8px 18px",
                  background: "#c62828",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isProcessing ? "wait" : "pointer",
                }}
              >
                {isProcessing ? "Processing…" : `Confirm Reject ${selectedIds.size} Orders`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
