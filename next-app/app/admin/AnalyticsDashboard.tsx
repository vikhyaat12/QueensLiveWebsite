"use client";

import React, { useState, useEffect, useCallback } from "react";
import TrackingPixelsConfig from "./components/TrackingPixelsConfig";

interface AnalyticsData {
  stats: {
    uniqueVisitors: number;
    uniqueSessions: number;
    pageViews: number;
    productViews: number;
    addToCarts: number;
    checkoutStarts: number;
    orders: number;
    revenue: number;
    pdfDownloads: number;
  };
  funnel: {
    visitors: number;
    productViews: number;
    addToCarts: number;
    checkoutStarts: number;
    orders: number;
    revenue: number;
    pdfDownloads: number;
  };
  topProducts: Array<{ name: string; count: number }>;
  topPages: Array<{ page: string; count: number }>;
  topSources: Array<{ source: string; count: number }>;
  deviceCounts: Record<string, number>;
  dailyTraffic: Array<{ date: string; count: number }>;
  events: Array<Record<string, unknown>>;
  total: number;
}

const statCard = (label: string, value: string | number, color?: string): React.CSSProperties => ({
  padding: "16px 20px",
  background: "#fff",
  border: "1px solid #e8e4df",
  borderRadius: 8,
  textAlign: "center" as const,
  minWidth: 120,
});

const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4, color: "#2A0F3A", textTransform: "uppercase", letterSpacing: ".04em" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e8e4df", fontSize: 13, borderRadius: 4, background: "#fff" };
const btnStyle: React.CSSProperties = { padding: "8px 16px", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 700 };

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "traffic" | "funnel" | "products" | "journey" | "sources" | "revenue" | "tracking">("overview");
  const [dateRange, setDateRange] = useState("7d");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [journeySessionId, setJourneySessionId] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let from = "";
      let to = "";
      const now = new Date();
      if (dateRange === "today") { from = now.toISOString().slice(0, 10); to = from; }
      else if (dateRange === "yesterday") { const y = new Date(now); y.setDate(y.getDate() - 1); from = y.toISOString().slice(0, 10); to = from; }
      else if (dateRange === "7d") { const d = new Date(now); d.setDate(d.getDate() - 7); from = d.toISOString().slice(0, 10); }
      else if (dateRange === "30d") { const d = new Date(now); d.setDate(d.getDate() - 30); from = d.toISOString().slice(0, 10); }
      else if (dateRange === "90d") { const d = new Date(now); d.setDate(d.getDate() - 90); from = d.toISOString().slice(0, 10); }
      else if (dateRange === "custom" && fromDate) { from = fromDate; to = toDate || ""; }

      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (eventFilter) params.set("event", eventFilter);
      if (productFilter) params.set("product", productFilter);
      if (deviceFilter) params.set("device", deviceFilter);
      if (sourceFilter) params.set("source", sourceFilter);
      params.set("limit", "500");

      const res = await fetch(`/api/analytics?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, fromDate, toDate, eventFilter, productFilter, deviceFilter, sourceFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (dateRange === "custom" && fromDate) { params.set("from", fromDate); if (toDate) params.set("to", toDate); }
    else if (dateRange !== "all") {
      const now = new Date();
      if (dateRange === "today") params.set("from", now.toISOString().slice(0, 10));
      else if (dateRange === "yesterday") { const y = new Date(now); y.setDate(y.getDate() - 1); params.set("from", y.toISOString().slice(0, 10)); }
      else if (dateRange === "7d") { const d = new Date(now); d.setDate(d.getDate() - 7); params.set("from", d.toISOString().slice(0, 10)); }
      else if (dateRange === "30d") { const d = new Date(now); d.setDate(d.getDate() - 30); params.set("from", d.toISOString().slice(0, 10)); }
      else if (dateRange === "90d") { const d = new Date(now); d.setDate(d.getDate() - 90); params.set("from", d.toISOString().slice(0, 10)); }
    }
    if (eventFilter) params.set("event", eventFilter);
    window.open(`/api/analytics/export?${params}`, "_blank");
  };

  const handleClearData = async () => {
    if (!confirm("Are you sure you want to clear ALL analytics data? This cannot be undone.")) return;
    try {
      await fetch("/api/analytics/clear", { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Failed to clear analytics:", err);
    }
  };

  const funnelConversion = (from: number, to: number) => from > 0 ? ((to / from) * 100).toFixed(1) : "0.0";
  const funnelDropoff = (from: number, to: number) => from > 0 ? (((from - to) / from) * 100).toFixed(1) : "0.0";

  const stats = data?.stats;
  const funnel = data?.funnel;

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "traffic" as const, label: "Traffic" },
    { id: "funnel" as const, label: "Funnel" },
    { id: "products" as const, label: "Products" },
    { id: "journey" as const, label: "Journey" },
    { id: "sources" as const, label: "Sources" },
    { id: "revenue" as const, label: "💰 Revenue" },
    { id: "tracking" as const, label: "⚙️ Tracking & Pixels" },
  ];

  const eventTypes = [
    { value: "", label: "All Events" },
    { value: "page_view", label: "Page Views" },
    { value: "product_view", label: "Product Views" },
    { value: "add_to_cart", label: "Add to Cart" },
    { value: "checkout_start", label: "Checkout Started" },
    { value: "order_placed", label: "Orders Placed" },
    { value: "pdf_download", label: "PDF Downloads" },
    { value: "search", label: "Searches" },
    { value: "cta_click", label: "CTA Clicks" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h3 style={{ font: "bold 20px var(--font-display)", color: "#2A0F3A", margin: 0 }}>📊 Analytics & Customer Journey</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={handleExport} style={{ ...btnStyle, background: "#2A0F3A", color: "#D4AF37" }}>📥 Export CSV</button>
          <button onClick={handleClearData} style={{ ...btnStyle, background: "#c0392b", color: "#fff" }}>🗑️ Clear Data</button>
          <button onClick={fetchData} style={{ ...btnStyle, background: "#e8e4df", color: "#2A0F3A" }}>↻ Refresh</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "2px solid #e8e4df", overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 18px", background: tab === t.id ? "#2A0F3A" : "transparent", color: tab === t.id ? "#D4AF37" : "#666", border: "none", borderBottom: tab === t.id ? "2px solid #D4AF37" : "2px solid transparent", marginBottom: -2, cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters (only for reporting tabs) */}
      {tab !== "tracking" && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={labelStyle}>Date Range</label>
            <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ ...inputStyle, width: 140 }}>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {dateRange === "custom" && (
            <>
              <div><label style={labelStyle}>From</label><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>To</label><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={inputStyle} /></div>
            </>
          )}
          <div>
            <label style={labelStyle}>Event Type</label>
            <select value={eventFilter} onChange={e => setEventFilter(e.target.value)} style={{ ...inputStyle, width: 160 }}>
              {eventTypes.map(et => <option key={et.value} value={et.value}>{et.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Product</label>
            <input placeholder="Filter product…" value={productFilter} onChange={e => setProductFilter(e.target.value)} style={{ ...inputStyle, width: 140 }} />
          </div>
          <div>
            <label style={labelStyle}>Device</label>
            <select value={deviceFilter} onChange={e => setDeviceFilter(e.target.value)} style={{ ...inputStyle, width: 120 }}>
              <option value="">All</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Source</label>
            <input placeholder="Filter source…" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{ ...inputStyle, width: 140 }} />
          </div>
        </div>
      )}

      {loading && <p style={{ textAlign: "center", color: "#999", padding: 40 }}>Loading analytics…</p>}

      {!loading && !data && <p style={{ textAlign: "center", color: "#999", padding: 40 }}>No analytics data available.</p>}

      {!loading && data && (
        <>
          {/* ─── OVERVIEW TAB ─── */}
          {tab === "overview" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 30 }}>
                {[
                  { label: "Visitors", value: stats?.uniqueVisitors || 0, color: "#2A0F3A" },
                  { label: "Sessions", value: stats?.uniqueSessions || 0, color: "#2A0F3A" },
                  { label: "Page Views", value: stats?.pageViews || 0, color: "#2A0F3A" },
                  { label: "Product Views", value: stats?.productViews || 0, color: "#C19A6B" },
                  { label: "Add to Cart", value: stats?.addToCarts || 0, color: "#2d8a4e" },
                  { label: "Checkouts", value: stats?.checkoutStarts || 0, color: "#C19A6B" },
                  { label: "Orders", value: stats?.orders || 0, color: "#2d8a4e" },
                  { label: "Revenue", value: `₹${(stats?.revenue || 0).toLocaleString("en-IN")}`, color: "#2d8a4e" },
                  { label: "PDF Downloads", value: stats?.pdfDownloads || 0, color: "#6b5ce7" },
                ].map((s, i) => (
                  <div key={i} style={statCard(s.label, String(s.value))}>
                    <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Mini Funnel */}
              <div style={{ background: "#faf8f5", border: "1px solid #e8e4df", borderRadius: 8, padding: 20, marginBottom: 20 }}>
                <h4 style={{ font: "bold 14px var(--font-display)", color: "#2A0F3A", marginBottom: 16 }}>Conversion Funnel</h4>
                {[
                  { label: "Visitors", count: funnel?.visitors || 0 },
                  { label: "Product Views", count: funnel?.productViews || 0 },
                  { label: "Add to Cart", count: funnel?.addToCarts || 0 },
                  { label: "Checkout", count: funnel?.checkoutStarts || 0 },
                  { label: "Order", count: funnel?.orders || 0 },
                ].map((step, i, arr) => {
                  const maxCount = arr[0].count || 1;
                  const widthPct = Math.max((step.count / maxCount) * 100, 4);
                  const conv = i > 0 ? funnelConversion(arr[i - 1].count, step.count) : "100.0";
                  const drop = i > 0 ? funnelDropoff(arr[i - 1].count, step.count) : "0.0";
                  return (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{step.label}</span>
                        <span style={{ color: "#666" }}>{step.count} {i > 0 && <>({conv}% conv · {drop}% drop)</>}</span>
                      </div>
                      <div style={{ background: "#e8e4df", borderRadius: 4, height: 20, overflow: "hidden" }}>
                        <div style={{ background: `linear-gradient(90deg, #2A0F3A, #C19A6B)`, width: `${widthPct}%`, height: "100%", borderRadius: 4, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Daily Traffic Chart (text-based) */}
              {data.dailyTraffic.length > 0 && (
                <div style={{ background: "#faf8f5", border: "1px solid #e8e4df", borderRadius: 8, padding: 20 }}>
                  <h4 style={{ font: "bold 14px var(--font-display)", color: "#2A0F3A", marginBottom: 16 }}>Daily Traffic</h4>
                  <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 120 }}>
                    {data.dailyTraffic.slice(-30).map((d, i) => {
                      const maxCount = Math.max(...data.dailyTraffic.map(x => x.count), 1);
                      const h = Math.max((d.count / maxCount) * 100, 2);
                      return (
                        <div key={i} style={{ flex: 1, textAlign: "center" }} title={`${d.date}: ${d.count}`}>
                          <div style={{ background: "#2A0F3A", height: `${h}%`, borderRadius: "2px 2px 0 0", minHeight: 2 }} />
                          <div style={{ fontSize: 8, color: "#999", marginTop: 2 }}>{d.date.slice(5)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TRAFFIC TAB ─── */}
          {tab === "traffic" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "#faf8f5", border: "1px solid #e8e4df", borderRadius: 8, padding: 20 }}>
                <h4 style={{ font: "bold 14px var(--font-display)", color: "#2A0F3A", marginBottom: 16 }}>Device Breakdown</h4>
                {Object.entries(data.deviceCounts).map(([device, count]) => {
                  const total = Object.values(data.deviceCounts).reduce((a, b) => a + b, 0) || 1;
                  return (
                    <div key={device} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{device}</span>
                        <span>{count} ({((count / total) * 100).toFixed(1)}%)</span>
                      </div>
                      <div style={{ background: "#e8e4df", borderRadius: 4, height: 14, overflow: "hidden" }}>
                        <div style={{ background: "#C19A6B", width: `${(count / total) * 100}%`, height: "100%", borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: "#faf8f5", border: "1px solid #e8e4df", borderRadius: 8, padding: 20 }}>
                <h4 style={{ font: "bold 14px var(--font-display)", color: "#2A0F3A", marginBottom: 16 }}>Top Pages</h4>
                {data.topPages.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e8e4df", fontSize: 13 }}>
                    <span style={{ fontFamily: "monospace", color: "#2A0F3A" }}>{p.page}</span>
                    <span style={{ fontWeight: 700 }}>{p.count}</span>
                  </div>
                ))}
                {data.topPages.length === 0 && <p style={{ color: "#999", textAlign: "center", padding: 20 }}>No page views yet.</p>}
              </div>
            </div>
          )}

          {/* ─── FUNNEL TAB ─── */}
          {tab === "funnel" && (
            <div style={{ background: "#faf8f5", border: "1px solid #e8e4df", borderRadius: 8, padding: 24 }}>
              <h4 style={{ font: "bold 16px var(--font-display)", color: "#2A0F3A", marginBottom: 20 }}>Product Conversion Funnel</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #2A0F3A" }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: "#2A0F3A" }}>Stage</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", color: "#2A0F3A" }}>Count</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", color: "#2A0F3A" }}>Conversion %</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", color: "#c0392b" }}>Drop-off %</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Visitors", count: funnel?.visitors || 0 },
                    { label: "Product Views", count: funnel?.productViews || 0 },
                    { label: "Add to Cart", count: funnel?.addToCarts || 0 },
                    { label: "Checkout Started", count: funnel?.checkoutStarts || 0 },
                    { label: "Order Placed", count: funnel?.orders || 0 },
                  ].map((step, i, arr) => (
                    <tr key={i} style={{ borderBottom: "1px solid #e8e4df" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{step.label}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{step.count.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#2d8a4e" }}>{i > 0 ? `${funnelConversion(arr[i - 1].count, step.count)}%` : "100%"}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#c0392b" }}>{i > 0 ? `${funnelDropoff(arr[i - 1].count, step.count)}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 20, padding: 16, background: "#fff", borderRadius: 6, border: "1px solid #e8e4df" }}>
                <p style={{ fontSize: 12, color: "#666" }}>Revenue: <b style={{ color: "#2d8a4e" }}>₹{(funnel?.revenue || 0).toLocaleString("en-IN")}</b> · PDF Downloads: <b>{funnel?.pdfDownloads || 0}</b></p>
              </div>
            </div>
          )}

          {/* ─── PRODUCTS TAB ─── */}
          {tab === "products" && (
            <div style={{ background: "#faf8f5", border: "1px solid #e8e4df", borderRadius: 8, padding: 20 }}>
              <h4 style={{ font: "bold 14px var(--font-display)", color: "#2A0F3A", marginBottom: 16 }}>Top Products by Views</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #2A0F3A" }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: "#2A0F3A" }}>Rank</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: "#2A0F3A" }}>Product</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", color: "#2A0F3A" }}>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #e8e4df" }}>
                      <td style={{ padding: "10px 12px", color: "#C19A6B", fontWeight: 700 }}>#{i + 1}</td>
                      <td style={{ padding: "10px 12px" }}>{p.name}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{p.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.topProducts.length === 0 && <p style={{ color: "#999", textAlign: "center", padding: 20 }}>No product views yet.</p>}
            </div>
          )}

          {/* ─── JOURNEY TAB ─── */}
          {tab === "journey" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Search Session ID</label>
                <input placeholder="Paste session ID to view journey…" value={journeySessionId} onChange={e => setJourneySessionId(e.target.value)} style={{ ...inputStyle, width: 400 }} />
              </div>
              <div style={{ background: "#faf8f5", border: "1px solid #e8e4df", borderRadius: 8, padding: 20 }}>
                <h4 style={{ font: "bold 14px var(--font-display)", color: "#2A0F3A", marginBottom: 16 }}>
                  {journeySessionId ? `Journey for Session: ${journeySessionId.slice(0, 20)}…` : "Recent Events"}
                </h4>
                <div style={{ maxHeight: 500, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #2A0F3A", position: "sticky", top: 0, background: "#faf8f5" }}>
                        <th style={{ textAlign: "left", padding: "8px 10px", color: "#2A0F3A" }}>Time</th>
                        <th style={{ textAlign: "left", padding: "8px 10px", color: "#2A0F3A" }}>Event</th>
                        <th style={{ textAlign: "left", padding: "8px 10px", color: "#2A0F3A" }}>Page</th>
                        <th style={{ textAlign: "left", padding: "8px 10px", color: "#2A0F3A" }}>Product</th>
                        <th style={{ textAlign: "left", padding: "8px 10px", color: "#2A0F3A" }}>Device</th>
                        <th style={{ textAlign: "left", padding: "8px 10px", color: "#2A0F3A" }}>Session</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(journeySessionId
                        ? data.events.filter(e => String(e.sessionId) === journeySessionId)
                        : data.events
                      ).slice(0, 200).map((e, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #e8e4df" }}>
                          <td style={{ padding: "6px 10px", whiteSpace: "nowrap", fontFamily: "monospace", fontSize: 11 }}>{String(e.timestamp).slice(0, 19).replace("T", " ")}</td>
                          <td style={{ padding: "6px 10px" }}>
                            <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: String(e.event).includes("order") ? "#e8f5e9" : String(e.event).includes("cart") ? "#fff3e0" : String(e.event).includes("product") ? "#f3e8ff" : "#e3f2fd", color: String(e.event).includes("order") ? "#2d8a4e" : String(e.event).includes("cart") ? "#e67e22" : String(e.event).includes("product") ? "#6b5ce7" : "#2196f3" }}>
                              {String(e.event)}
                            </span>
                          </td>
                          <td style={{ padding: "6px 10px", fontFamily: "monospace", fontSize: 11 }}>{String(e.page).slice(0, 40)}</td>
                          <td style={{ padding: "6px 10px" }}>{String(e.product || "—")}</td>
                          <td style={{ padding: "6px 10px" }}>{String(e.device)}</td>
                          <td style={{ padding: "6px 10px", fontFamily: "monospace", fontSize: 10, color: "#999" }}>{String(e.sessionId).slice(0, 12)}…</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.events.length === 0 && <p style={{ color: "#999", textAlign: "center", padding: 20 }}>No events recorded yet.</p>}
                </div>
                <p style={{ fontSize: 11, color: "#999", marginTop: 12 }}>Showing {Math.min(data.events.length, 200)} of {data.total} total events</p>
              </div>
            </div>
          )}

          {/* ─── SOURCES TAB ─── */}
          {tab === "sources" && (
            <div style={{ background: "#faf8f5", border: "1px solid #e8e4df", borderRadius: 8, padding: 20 }}>
              <h4 style={{ font: "bold 14px var(--font-display)", color: "#2A0F3A", marginBottom: 16 }}>Traffic Sources</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #2A0F3A" }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: "#2A0F3A" }}>Rank</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: "#2A0F3A" }}>Source</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", color: "#2A0F3A" }}>Events</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: "#2A0F3A", width: "40%" }}>Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topSources.map((s, i) => {
                    const maxCount = data.topSources[0]?.count || 1;
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #e8e4df" }}>
                        <td style={{ padding: "10px 12px", color: "#C19A6B", fontWeight: 700 }}>#{i + 1}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>{s.source}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{s.count}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ background: "#e8e4df", borderRadius: 4, height: 14, overflow: "hidden" }}>
                            <div style={{ background: "#2A0F3A", width: `${(s.count / maxCount) * 100}%`, height: "100%", borderRadius: 4 }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {data.topSources.length === 0 && <p style={{ color: "#999", textAlign: "center", padding: 20 }}>No traffic sources recorded yet.</p>}            </div>
          )}

          {tab === "revenue" && (
            <div>
              {(() => {
                // Compute monthly revenue breakdown from order events
                const orderEvents = (data?.events || []).filter((e: Record<string, unknown>) => String(e.event) === "order_placed");
                const monthlyRevenue: Record<string, number> = {};
                orderEvents.forEach((e: Record<string, unknown>) => {
                  const month = String(e.timestamp || "").slice(0, 7); // YYYY-MM
                  if (month) monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (Number(e.value) || 0);
                });
                const sortedMonths = Object.entries(monthlyRevenue).sort((a, b) => a[0].localeCompare(b[0]));
                const totalRevenue = orderEvents.reduce((sum: number, e: Record<string, unknown>) => sum + (Number(e.value) || 0), 0);
                const totalOrders = orderEvents.length;
                const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
                const currentMonth = sortedMonths.length > 0 ? sortedMonths[sortedMonths.length - 1] : null;
                const previousMonth = sortedMonths.length > 1 ? sortedMonths[sortedMonths.length - 2] : null;
                const monthChange = currentMonth && previousMonth ? ((currentMonth[1] - previousMonth[1]) / (previousMonth[1] || 1)) * 100 : 0;

                // Daily revenue for high/low analysis
                const dailyRevenue: Record<string, number> = {};
                orderEvents.forEach((e: Record<string, unknown>) => {
                  const day = String(e.timestamp || "").slice(0, 10);
                  if (day) dailyRevenue[day] = (dailyRevenue[day] || 0) + (Number(e.value) || 0);
                });
                const sortedDays = Object.entries(dailyRevenue).sort((a, b) => b[1] - a[1]);
                const highDays = sortedDays.slice(0, 5);
                const lowDays = sortedDays.slice(-5).reverse();

                return (
                  <>
                    {/* Summary cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
                      <div style={{ padding: 16, background: "#fff", border: "1px solid #e8e4df", borderRadius: 8, textAlign: "center" }}>
                        <span style={labelStyle}>Total Revenue</span>
                        <p style={{ fontSize: 24, fontWeight: 700, color: "#2d8a4e", margin: "8px 0 0" }}>₹{totalRevenue.toLocaleString("en-IN")}</p>
                      </div>
                      <div style={{ padding: 16, background: "#fff", border: "1px solid #e8e4df", borderRadius: 8, textAlign: "center" }}>
                        <span style={labelStyle}>Total Orders</span>
                        <p style={{ fontSize: 24, fontWeight: 700, color: "#2A0F3A", margin: "8px 0 0" }}>{totalOrders}</p>
                      </div>
                      <div style={{ padding: 16, background: "#fff", border: "1px solid #e8e4df", borderRadius: 8, textAlign: "center" }}>
                        <span style={labelStyle}>Avg Order Value</span>
                        <p style={{ fontSize: 24, fontWeight: 700, color: "#C19A6B", margin: "8px 0 0" }}>₹{avgOrderValue.toLocaleString("en-IN")}</p>
                      </div>
                      <div style={{ padding: 16, background: "#fff", border: "1px solid #e8e4df", borderRadius: 8, textAlign: "center" }}>
                        <span style={labelStyle}>Month vs Previous</span>
                        <p style={{ fontSize: 24, fontWeight: 700, color: monthChange >= 0 ? "#2d8a4e" : "#c0392b", margin: "8px 0 0" }}>{monthChange >= 0 ? "+" : ""}{monthChange.toFixed(1)}%</p>
                        <p style={{ fontSize: 11, color: "#999", margin: 0 }}>{currentMonth ? currentMonth[0] : "—"} vs {previousMonth ? previousMonth[0] : "—"}</p>
                      </div>
                    </div>

                    {/* Monthly breakdown */}
                    <div style={{ background: "#faf8f5", border: "1px solid #e8e4df", borderRadius: 8, padding: 20, marginBottom: 20 }}>
                      <h4 style={{ font: "bold 14px var(--font-display)", color: "#2A0F3A", marginBottom: 16 }}>Monthly Revenue Breakdown</h4>
                      {sortedMonths.length === 0 ? (
                        <p style={{ color: "#999", textAlign: "center", padding: 20 }}>No order revenue data yet.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {sortedMonths.map(([month, rev]) => {
                            const maxRev = sortedMonths[sortedMonths.length - 1][1] || 1;
                            return (
                              <div key={month} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ width: 80, fontSize: 12, fontWeight: 600, color: "#2A0F3A" }}>{month}</span>
                                <div style={{ flex: 1, background: "#e8e4df", borderRadius: 4, height: 20, overflow: "hidden" }}>
                                  <div style={{ background: "linear-gradient(90deg, #2A0F3A, #C19A6B)", width: `${(rev / maxRev) * 100}%`, height: "100%", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6 }}>
                                    <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>₹{rev.toLocaleString("en-IN")}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* High/Low days */}
                    {sortedDays.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div style={{ background: "#faf8f5", border: "1px solid #e8e4df", borderRadius: 8, padding: 20 }}>
                          <h4 style={{ font: "bold 14px var(--font-display)", color: "#2A0F3A", marginBottom: 12 }}>🏆 Highest Sales Days</h4>
                          {highDays.map(([day, rev], i) => (
                            <div key={day} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e8e4df", fontSize: 12 }}>
                              <span style={{ color: "#666" }}>{new Date(day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                              <span style={{ fontWeight: 700, color: "#2d8a4e" }}>₹{rev.toLocaleString("en-IN")}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: "#faf8f5", border: "1px solid #e8e4df", borderRadius: 8, padding: 20 }}>
                          <h4 style={{ font: "bold 14px var(--font-display)", color: "#2A0F3A", marginBottom: 12 }}>📉 Lowest Sales Days</h4>
                          {lowDays.map(([day, rev], i) => (
                            <div key={day} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e8e4df", fontSize: 12 }}>
                              <span style={{ color: "#666" }}>{new Date(day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                              <span style={{ fontWeight: 700, color: "#c0392b" }}>₹{rev.toLocaleString("en-IN")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* ─── TRACKING & PIXELS TAB ─── */}
      {tab === "tracking" && (
        <div style={{ marginTop: 10 }}>
          <TrackingPixelsConfig />
        </div>
      )}

    </div>
  );
}
