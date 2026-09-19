"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  total: number;
  lines?: Array<{
    productId?: string;
    quantity?: number;
    unitPrice?: number;
    name?: string;
    product?: { name?: string; image?: string };
  }>;
};

const STATUS_THEMES: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: "#fff8e1", text: "#b78103", border: "#ffe082" },
  confirmed: { bg: "#e8f5e9", text: "#2e7d32", border: "#c8e6c9" },
  processing: { bg: "#e3f2fd", text: "#1565c0", border: "#bbdefb" },
  packed: { bg: "#e0f2f1", text: "#00695c", border: "#b2dfdb" },
  shipped: { bg: "#ede7f6", text: "#512da8", border: "#d1c4e9" },
  out_for_delivery: { bg: "#fff3e0", text: "#e65100", border: "#ffe0b2" },
  delivered: { bg: "#e8f5e9", text: "#1b5e20", border: "#a5d6a7" },
  completed: { bg: "#e8f5e9", text: "#1b5e20", border: "#a5d6a7" },
  cancelled: { bg: "#ffebee", text: "#c62828", border: "#ffcdd2" },
  rejected: { bg: "#ffebee", text: "#c62828", border: "#ffcdd2" },
  refunded: { bg: "#f3e5f5", text: "#6a1b9a", border: "#e1bee7" },
};

function StatusBadge({ status }: { status: string }) {
  const norm = (status || "pending").toLowerCase();
  const theme = STATUS_THEMES[norm] || { bg: "#f5f5f5", text: "#616161", border: "#e0e0e0" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        textTransform: "capitalize",
        background: theme.bg,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        letterSpacing: "0.02em",
      }}
    >
      {norm.replace(/_/g, " ")}
    </span>
  );
}

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/orders");
        if (res.status === 401) {
          router.push("/account");
          return;
        }
        const data = await res.json();
        if (active && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      } catch {}
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filterStatus !== "all" && (o.status || "").toLowerCase() !== filterStatus) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesId = (o.id || "").toLowerCase().includes(q);
        const matchesItems = (o.lines || []).some((l) =>
          (l.name || l.product?.name || l.productId || "").toLowerCase().includes(q)
        );
        if (!matchesId && !matchesItems) return false;
      }
      return true;
    });
  }, [orders, filterStatus, search]);

  const uniqueStatuses = useMemo(() => {
    const s = new Set<string>();
    orders.forEach((o) => {
      if (o.status) s.add(o.status.toLowerCase());
    });
    return Array.from(s);
  }, [orders]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper, #faf9f6)", padding: "40px 20px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Navigation Breadcrumbs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--muted, #666)", marginBottom: 24 }}>
          <Link href="/account" style={{ color: "inherit", textDecoration: "none" }}>
            ← Back to Account Dashboard
          </Link>
          <span>/</span>
          <span style={{ color: "var(--purple, #240e35)", fontWeight: 600 }}>Your Orders</span>
        </div>

        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold, #b8860b)", fontWeight: 700 }}>
              Queens Care Laboratories
            </span>
            <h1 style={{ font: "32px var(--font-display, serif)", margin: "6px 0 0", color: "var(--purple, #240e35)" }}>
              Order History
            </h1>
          </div>
          <Link
            href="/#collection"
            style={{
              padding: "10px 18px",
              background: "var(--purple, #240e35)",
              color: "#fff",
              textDecoration: "none",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            Explore Formulations →
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--line, #e6e4ea)",
            borderRadius: 8,
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ flex: "1 1 240px" }}>
            <input
              placeholder="Search by Order ID or Formulation name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 4,
                border: "1px solid var(--line, #e6e4ea)",
                fontSize: 13,
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              onClick={() => setFilterStatus("all")}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: filterStatus === "all" ? 700 : 500,
                border: filterStatus === "all" ? "1px solid var(--purple, #240e35)" : "1px solid #ddd",
                background: filterStatus === "all" ? "var(--purple, #240e35)" : "#fff",
                color: filterStatus === "all" ? "#fff" : "#444",
                cursor: "pointer",
              }}
            >
              All ({orders.length})
            </button>
            {uniqueStatuses.map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: filterStatus === st ? 700 : 500,
                  border: filterStatus === st ? "1px solid var(--purple, #240e35)" : "1px solid #ddd",
                  background: filterStatus === st ? "var(--purple, #240e35)" : "#fff",
                  color: filterStatus === st ? "#fff" : "#444",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {st.replace(/_/g, " ")} ({orders.filter((o) => (o.status || "").toLowerCase() === st).length})
              </button>
            ))}
          </div>
        </div>

        {/* Orders Listing */}
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--muted, #666)" }}>
            <p style={{ fontSize: 14 }}>Loading your orders…</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              background: "#fff",
              border: "1px solid var(--line, #e6e4ea)",
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 42, display: "block", marginBottom: 12 }}>📦</span>
            <h3 style={{ font: "20px var(--font-display, serif)", margin: "0 0 8px", color: "var(--purple, #240e35)" }}>
              {orders.length === 0 ? "No orders placed yet" : "No matching orders found"}
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted, #666)", maxWidth: 440, margin: "0 auto 20px" }}>
              {orders.length === 0
                ? "Experience our clinically validated cosmeceuticals and wellness formulations designed for noticeable results."
                : "Try adjusting your search keywords or status filter."}
            </p>
            {orders.length === 0 && (
              <Link
                href="/#collection"
                style={{
                  display: "inline-block",
                  padding: "10px 22px",
                  background: "var(--purple, #240e35)",
                  color: "#fff",
                  borderRadius: 4,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Browse Formulations
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {filteredOrders.map((order) => {
              const lines = order.lines || [];
              const itemCount = lines.reduce((acc, l) => acc + (l.quantity || 1), 0);
              const firstLineName = lines[0]?.product?.name || lines[0]?.name || "Pharmaceutical Item";
              const extraLinesCount = lines.length - 1;

              return (
                <div
                  key={order.id}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--line, #e6e4ea)",
                    borderRadius: 8,
                    overflow: "hidden",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  {/* Order Top Bar */}
                  <div
                    style={{
                      padding: "14px 20px",
                      background: "#faf9fc",
                      borderBottom: "1px solid var(--line, #e6e4ea)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div>
                        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted, #666)" }}>
                          Order Placed
                        </span>
                        <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 500 }}>
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      <div>
                        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted, #666)" }}>
                          Total Amount
                        </span>
                        <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: "var(--purple, #240e35)" }}>
                          {inr(order.total)}
                        </p>
                      </div>

                      <div>
                        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted, #666)" }}>
                          Payment
                        </span>
                        <p style={{ margin: "2px 0 0", fontSize: 12, textTransform: "uppercase" }}>
                          {order.paymentMethod || "COD"} • {order.paymentStatus || "pending"}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12, color: "#555" }}>
                        #{order.id.slice(0, 16)}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  {/* Order Body */}
                  <div
                    style={{
                      padding: "20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 16,
                    }}
                  >
                    <div>
                      <h4 style={{ font: "16px var(--font-display, serif)", margin: "0 0 6px", color: "var(--purple, #240e35)" }}>
                        {firstLineName}
                        {extraLinesCount > 0 && (
                          <span style={{ fontSize: 12, color: "var(--muted, #666)", fontWeight: 400, marginLeft: 8 }}>
                            + {extraLinesCount} more item{extraLinesCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </h4>
                      <p style={{ fontSize: 12, color: "var(--muted, #666)", margin: 0 }}>
                        {itemCount} item{itemCount !== 1 ? "s" : ""} total
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <Link
                        href={`/account/orders/${encodeURIComponent(order.id)}`}
                        style={{
                          display: "inline-block",
                          padding: "8px 16px",
                          borderRadius: 4,
                          background: "var(--purple, #240e35)",
                          color: "#fff",
                          textDecoration: "none",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        View Order Details →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
