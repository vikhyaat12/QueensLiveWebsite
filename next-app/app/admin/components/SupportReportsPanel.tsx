"use client";

import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   SUPPORT REPORTS — real data only from /api/admin/support/reports.
   Shows "No data yet" where counts are zero. Nothing fabricated.
   ═══════════════════════════════════════════════════════════════ */

type Reports = {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  totalConversations: number;
  chatToTicketConversion: number;
  avgFirstResponseHours: number;
  avgResolutionHours: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byAgent: Record<string, number>;
  byProduct: Record<string, number>;
  byOrder: Record<string, number>;
  attachmentCount: number;
};

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent || "var(--purple, #2A0F3A)" }}>{value}</div>
    </div>
  );
}

function Breakdown({ title, data, emptyLabel = "No data yet" }: { title: string; data: Record<string, number>; emptyLabel?: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: 16 }}>
      <b style={{ fontSize: 12.5, color: "var(--purple, #2A0F3A)" }}>{title}</b>
      {entries.length === 0 ? (
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--muted)" }}>{emptyLabel}</p>
      ) : (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {entries.map(([k, v]) => (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "minmax(90px, 1.4fr) 1fr 44px", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k}</span>
              <div style={{ background: "#F1F5F9", borderRadius: 4, height: 8, overflow: "hidden" }}>
                <div style={{ width: `${(v / max) * 100}%`, height: "100%", background: "var(--purple, #2A0F3A)" }} />
              </div>
              <b style={{ textAlign: "right" }}>{v}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SupportReportsPanel() {
  const [reports, setReports] = useState<Reports | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/support/reports")
      .then((r) => r.json())
      .then((d) => setReports(d.reports || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading support reports…</p>;
  if (!reports) return <p style={{ color: "var(--muted)", fontSize: 13 }}>No report data available yet.</p>;

  return (
    <div>
      <h2 style={{ margin: "0 0 14px", fontSize: 17, fontWeight: 700, color: "var(--purple, #2A0F3A)" }}>📊 Support Reports</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
        <Stat label="Total Conversations" value={reports.totalConversations} />
        <Stat label="Total Tickets" value={reports.totalTickets} />
        <Stat label="Open Tickets" value={reports.openTickets} accent="#B45309" />
        <Stat label="Resolved" value={reports.resolvedTickets} accent="#15803D" />
        <Stat label="Closed" value={reports.closedTickets} />
        <Stat label="Avg First Response" value={reports.avgFirstResponseHours ? `${reports.avgFirstResponseHours}h` : "—"} />
        <Stat label="Avg Resolution" value={reports.avgResolutionHours ? `${reports.avgResolutionHours}h` : "—"} />
        <Stat label="Chat → Ticket" value={`${reports.chatToTicketConversion}%`} accent="#0369A1" />
        <Stat label="Attachments" value={reports.attachmentCount} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        <Breakdown title="Tickets by Status" data={reports.byStatus} />
        <Breakdown title="Tickets by Category" data={reports.byCategory} />
        <Breakdown title="Tickets by Priority" data={reports.byPriority} />
        <Breakdown title="Tickets by Agent" data={reports.byAgent} />
        <Breakdown title="Tickets by Product" data={reports.byProduct} />
        <Breakdown title="Tickets by Order" data={reports.byOrder} />
      </div>
    </div>
  );
}
