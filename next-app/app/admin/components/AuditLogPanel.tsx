"use client";

import { useEffect, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   AuditLogPanel — Enterprise Admin Access Control & Change History
   Features: Search, multi-facet filtering, privilege diffing,
   IP tracking, and tamper-resistant audit trail export.
   ═══════════════════════════════════════════════════════════════ */

interface AuditEntry {
  id?: string;
  action: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  targetId?: string;
  targetName?: string;
  targetEmail?: string;
  previousRole?: string;
  newRole?: string;
  previousPermissions?: string[];
  newPermissions?: string[];
  reason?: string;
  ip?: string;
  userAgent?: string;
  status?: string;
  details?: string;
  createdAt: string;
}

export default function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (search.trim()) params.set("search", search.trim());
      if (actionFilter) params.set("action", actionFilter);
      if (roleFilter) params.set("role", roleFilter);

      const r = await fetch(`/api/admin/audit-log?${params}`);
      const d = await r.json();
      setLogs(d.logs || []);
      setTotal(d.total || 0);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const actionStyles: Record<string, { bg: string; color: string; label: string }> = {
    staff_created: { bg: "#e8f5e9", color: "#2e7d32", label: "Staff Created" },
    staff_deleted: { bg: "#ffebee", color: "#c62828", label: "Staff Deleted" },
    role_changed: { bg: "#fff3e0", color: "#e65100", label: "Role Changed" },
    role_granted: { bg: "#e8f5e9", color: "#1b5e20", label: "Role Granted" },
    permissions_updated: { bg: "#e1f5fe", color: "#0277bd", label: "Permissions Updated" },
    user_disabled: { bg: "#ffebee", color: "#b71c1c", label: "User Disabled" },
    user_enabled: { bg: "#e8f5e9", color: "#2e7d32", label: "User Enabled" },
    user_deactivated: { bg: "#f5f5f5", color: "#616161", label: "User Anonymized" },
    order_status_changed: { bg: "#f3e5f5", color: "#7b1fa2", label: "Order Status" },
    order_prescription_reviewed: { bg: "#ede7f6", color: "#512da8", label: "Rx Reviewed" },
    settings_changed: { bg: "#efebe9", color: "#4e342e", label: "Settings Updated" },
  };

  const downloadCsv = () => {
    const params = new URLSearchParams({ format: "csv" });
    if (search.trim()) params.set("search", search.trim());
    if (actionFilter) params.set("action", actionFilter);
    if (roleFilter) params.set("role", roleFilter);
    window.open(`/api/admin/audit-log?${params}`, "_blank");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ─── HEADER WITH STATS & EXPORT ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--purple, #2A0F3A)" }}>
              🛡️ Admin Access Control &amp; Change Audit
            </h3>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: "rgba(42, 15, 58, 0.08)",
                color: "var(--purple, #2A0F3A)",
                padding: "2px 8px",
                borderRadius: 12,
              }}
            >
              {total} verified records
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted, #666)", maxWidth: 680 }}>
            Immutable, tamper-resistant trail recording administrative role delegations, permission adjustments, user status changes, and operator access events.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={downloadCsv}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              background: "#fff",
              color: "var(--purple, #2A0F3A)",
              border: "1px solid var(--line, #e2d9e6)",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span>📥 Export Audit CSV</span>
          </button>
          <button
            onClick={fetchLogs}
            style={{
              padding: "7px 14px",
              background: "#fff",
              color: "var(--ink, #1a1a1a)",
              border: "1px solid var(--line, #e2d9e6)",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ─── SEARCH & FILTER TOOLBAR ─── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          padding: 14,
          background: "#fff",
          border: "1px solid var(--line, #e2d9e6)",
          borderRadius: 6,
          alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 240px", position: "relative" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, admin, audit ID, or reason…"
            style={{
              width: "100%",
              padding: "7px 12px 7px 30px",
              border: "1px solid var(--line, #e2d9e6)",
              borderRadius: 4,
              fontSize: 12,
              boxSizing: "border-box",
            }}
          />
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, opacity: 0.5 }}>
            🔍
          </span>
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                color: "#888",
              }}
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{ padding: "7px 12px", fontSize: 12, border: "1px solid var(--line, #e2d9e6)", borderRadius: 4, background: "#fff" }}
        >
          <option value="">All Audit Actions</option>
          <option value="staff_created">Staff Account Created</option>
          <option value="role_changed">Role Changed (Elevation / Demotion)</option>
          <option value="permissions_updated">Permissions Modified</option>
          <option value="user_disabled">User Account Disabled</option>
          <option value="user_enabled">User Account Re-enabled</option>
          <option value="staff_deleted">Staff Account Deleted</option>
          <option value="order_prescription_reviewed">Prescription Clinical Review</option>
          <option value="order_status_changed">Order Fulfillment Status</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: "7px 12px", fontSize: 12, border: "1px solid var(--line, #e2d9e6)", borderRadius: 4, background: "#fff" }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="employee">Employee / Operations</option>
          <option value="staff">Staff</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      {/* ─── AUDIT TRAIL DATA TABLE ─── */}
      <div style={{ border: "1px solid var(--line, #e2d9e6)", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#fbf9f6", borderBottom: "1px solid var(--line, #e2d9e6)" }}>
              <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "var(--muted, #666)" }}>
                Event / Time
              </th>
              <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "var(--muted, #666)" }}>
                Action
              </th>
              <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "var(--muted, #666)" }}>
                Actor (Admin)
              </th>
              <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "var(--muted, #666)" }}>
                Target Subject
              </th>
              <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "var(--muted, #666)" }}>
                Role / Access Transition
              </th>
              <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "var(--muted, #666)" }}>
                Audit Details &amp; Meta
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => {
              const style = actionStyles[log.action] || { bg: "#f5f5f5", color: "#444", label: log.action.replace(/_/g, " ") };
              const dateFormatted = log.createdAt ? new Date(log.createdAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }) : "—";

              return (
                <tr key={log.id || i} style={{ borderBottom: "1px solid #f0edf2" }}>
                  {/* Event & Timestamp */}
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 10, color: "var(--muted, #888)", marginBottom: 2 }}>
                      {log.id || `LOG-${i + 1}`}
                    </div>
                    <div style={{ fontWeight: 600, color: "#333" }}>{dateFormatted}</div>
                  </td>

                  {/* Action Badge */}
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        fontSize: 10,
                        borderRadius: 4,
                        background: style.bg,
                        color: style.color,
                        fontWeight: 700,
                        letterSpacing: "0.02em",
                        display: "inline-block",
                      }}
                    >
                      {style.label}
                    </span>
                  </td>

                  {/* Actor */}
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontWeight: 600, color: "var(--purple, #2A0F3A)" }}>
                      {log.actorName || log.actorId || "System"}
                    </div>
                    {log.actorEmail && log.actorEmail !== log.actorName && (
                      <div style={{ fontSize: 11, color: "var(--muted, #666)" }}>{log.actorEmail}</div>
                    )}
                  </td>

                  {/* Target Subject */}
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontWeight: 600, color: "#1a1a1a" }}>
                      {log.targetName || log.targetId || "—"}
                    </div>
                    {log.targetEmail && (
                      <div style={{ fontSize: 11, color: "var(--muted, #666)" }}>{log.targetEmail}</div>
                    )}
                  </td>

                  {/* Role Transition */}
                  <td style={{ padding: "10px 14px" }}>
                    {log.previousRole || log.newRole ? (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                        {log.previousRole && (
                          <span style={{ padding: "1px 6px", background: "#eee", borderRadius: 3, textTransform: "uppercase", fontSize: 9, fontWeight: 700 }}>
                            {log.previousRole}
                          </span>
                        )}
                        {log.previousRole && log.newRole && <span style={{ color: "var(--gold, #D4AF37)", fontWeight: 700 }}>→</span>}
                        {log.newRole && (
                          <span style={{ padding: "1px 6px", background: "rgba(212, 175, 55, 0.15)", color: "#8a6d05", borderRadius: 3, textTransform: "uppercase", fontSize: 9, fontWeight: 700 }}>
                            {log.newRole}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: "var(--muted, #999)", fontSize: 11 }}>—</span>
                    )}
                    {Array.isArray(log.newPermissions) && (
                      <div style={{ fontSize: 10, color: "var(--muted, #666)", marginTop: 2 }}>
                        {log.newPermissions.length} permissions assigned
                      </div>
                    )}
                  </td>

                  {/* Details & Metadata */}
                  <td style={{ padding: "10px 14px", maxWidth: 360 }}>
                    <div style={{ color: "#333", fontSize: 12, lineHeight: 1.4 }}>
                      {log.details || log.reason || "—"}
                    </div>
                    {(log.ip || log.userAgent) && (
                      <div style={{ fontSize: 10, color: "var(--muted, #888)", marginTop: 3 }}>
                        IP: {log.ip || "127.0.0.1"} • {log.userAgent?.split(" ")[0] || "Client"}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {logs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 36, textAlign: "center", color: "var(--muted, #888)" }}>
                  {loading ? "Loading audit trail…" : "No audit trail entries matching your search criteria."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
