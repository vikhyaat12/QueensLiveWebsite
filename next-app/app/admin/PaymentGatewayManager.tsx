"use client";

import { useState, useEffect } from "react";

type PaymentGateway = {
  id: string;
  provider: string;
  displayName: string;
  description?: string;
  icon?: string;
  mode: "test" | "live";
  enabled: boolean;
  isConfigured: boolean;
  status: "connected" | "not_configured" | "disabled" | "error";
  sort: number;
  codCharge?: number;
  minOrderValue?: number;
  maxOrderValue?: number;
  instructions?: string;
  credentials?: Record<string, string>;
};

const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid var(--line)", fontSize: 13, background: "#fff" };
const labelStyle = { fontSize: 11, fontWeight: 600 as const, display: "block" as const, marginBottom: 4, color: "#444" };

export default function PaymentGatewayManager() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PaymentGateway>>({});
  const [editCreds, setEditCreds] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [globalNotice, setGlobalNotice] = useState<{ text: string; isError: boolean } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ provider: "", displayName: "", icon: "💳", description: "", mode: "test" as "test" | "live", sort: 10 });
  const [addCreds, setAddCreds] = useState<Array<{ key: string; value: string }>>([]);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/payments");
      const d = await res.json();
      if (res.ok && Array.isArray(d.gateways)) {
        setGateways(d.gateways);
      }
    } catch {
      setGlobalNotice({ text: "Failed to load payment gateways.", isError: true });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  const openEdit = (gw: PaymentGateway) => {
    setEditingId(gw.id);
    setEditForm({ ...gw });
    setEditCreds({ ...(gw.credentials || {}) });
    setTestResult(null);
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditForm({});
    setEditCreds({});
    setTestResult(null);
  };

  const toggleEnabled = async (gw: PaymentGateway) => {
    const newEnabled = !gw.enabled;
    try {
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: gw.id, enabled: newEnabled }),
      });
      if (res.ok) {
        setGateways(gateways.map(g => g.id === gw.id ? { ...g, enabled: newEnabled, status: newEnabled ? (g.isConfigured ? "connected" : "not_configured") : "disabled" } : g));
        setGlobalNotice({ text: `${gw.displayName} is now ${newEnabled ? "enabled" : "disabled"}.`, isError: false });
      }
    } catch {
      setGlobalNotice({ text: "Failed to update status.", isError: true });
    }
  };

  const saveGateway = async () => {
    if (!editingId) return;
    setSaving(true);
    setGlobalNotice(null);
    try {
      const payload = {
        ...editForm,
        id: editingId,
        credentials: editCreds,
      };
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (res.ok) {
        setGlobalNotice({ text: "Payment gateway configuration saved successfully!", isError: false });
        closeEdit();
        fetchGateways();
      } else {
        setGlobalNotice({ text: d.error || "Failed to save configuration.", isError: true });
      }
    } catch {
      setGlobalNotice({ text: "Network error while saving.", isError: true });
    }
    setSaving(false);
  };

  const testConnection = async (gwId: string) => {
    setTestingId(gwId);
    setTestResult(null);
    try {
      const payload: Record<string, unknown> = { id: gwId };
      if (editingId === gwId) {
        payload.credentials = editCreds;
        payload.mode = editForm.mode;
      }
      const res = await fetch("/api/admin/payments/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      setTestResult({ id: gwId, success: Boolean(d.success), message: d.message || "Test complete." });
      if (d.success) {
        fetchGateways();
      }
    } catch {
      setTestResult({ id: gwId, success: false, message: "Network error during connection test." });
    }
    setTestingId(null);
  };

  const addGateway = async () => {
    const provider = addForm.provider.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!provider || !addForm.displayName.trim()) {
      setGlobalNotice({ text: "Provider key and display name are required.", isError: true });
      return;
    }
    setAdding(true);
    setGlobalNotice(null);
    try {
      const credentials = Object.fromEntries(addCreds.filter(c => c.key.trim()).map(c => [c.key.trim(), c.value]));
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          displayName: addForm.displayName.trim(),
          icon: addForm.icon || "💳",
          description: addForm.description.trim(),
          mode: addForm.mode,
          sort: Number(addForm.sort) || 10,
          enabled: false,
          credentials,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setGlobalNotice({ text: `${addForm.displayName.trim()} added. Configure its credentials, then enable it.`, isError: false });
        setShowAdd(false);
        setAddForm({ provider: "", displayName: "", icon: "💳", description: "", mode: "test", sort: 10 });
        setAddCreds([]);
        fetchGateways();
      } else {
        setGlobalNotice({ text: d.error || "Failed to add the payment partner.", isError: true });
      }
    } catch {
      setGlobalNotice({ text: "Network error while adding the partner.", isError: true });
    }
    setAdding(false);
  };

  const deleteGateway = async (gw: PaymentGateway) => {
    if (gw.provider === "cod") {
      setGlobalNotice({ text: "The built-in Cash on Delivery method cannot be deleted — disable it instead.", isError: true });
      return;
    }
    if (!window.confirm(`Delete the payment partner “${gw.displayName}”? Customers will no longer see it at checkout. This cannot be undone.`)) return;
    setDeletingId(gw.id);
    try {
      const res = await fetch(`/api/admin/payments?id=${encodeURIComponent(gw.id)}`, { method: "DELETE" });
      const d = await res.json();
      if (res.ok && d.success) {
        setGlobalNotice({ text: `${gw.displayName} deleted.`, isError: false });
        if (editingId === gw.id) closeEdit();
        fetchGateways();
      } else {
        setGlobalNotice({ text: d.error || "Failed to delete the partner.", isError: true });
      }
    } catch {
      setGlobalNotice({ text: "Network error while deleting.", isError: true });
    }
    setDeletingId(null);
  };

  if (loading) {
    return <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading payment gateways…</p>;
  }

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header Info */}
      <div style={{ background: "#fbf9f5", border: "1px solid var(--line)", padding: "18px 22px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, font: "18px var(--font-display)", color: "var(--purple)" }}>Payment Partners & Checkout Control</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
              Add unlimited payment partners, configure credentials, and control what customers see at checkout. Secrets are stored server-side and never exposed publicly.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: 11, padding: "4px 10px", background: "#e9f7e9", color: "#2e7d32", border: "1px solid #c3e6cb" }}>
              🟢 {gateways.filter(g => g.enabled && g.isConfigured).length} Active & Connected
            </span>
            <span style={{ fontSize: 11, padding: "4px 10px", background: "#f3f4f6", color: "#666", border: "1px solid #e5e7eb" }}>
              ⚪ {gateways.filter(g => !g.isConfigured && g.enabled).length} Not Configured
            </span>
            <button
              onClick={() => setShowAdd(v => !v)}
              style={{ fontSize: 11, padding: "5px 12px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              {showAdd ? "Close" : "+ Add payment partner"}
            </button>
          </div>
        </div>

        {/* Add new partner */}
        {showAdd && (
          <div style={{ marginTop: 16, padding: 18, background: "#fff", border: "1px solid var(--purple)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label style={labelStyle}>Provider key * <span style={{ fontWeight: 400, color: "var(--muted)" }}>(lowercase id, e.g. juspay)</span></label>
                <input value={addForm.provider} onChange={e => setAddForm({ ...addForm, provider: e.target.value })} style={inputStyle} placeholder="e.g. cashfree" />
              </div>
              <div>
                <label style={labelStyle}>Display name *</label>
                <input value={addForm.displayName} onChange={e => setAddForm({ ...addForm, displayName: e.target.value })} style={inputStyle} placeholder="e.g. Cashfree Payments" />
              </div>
              <div>
                <label style={labelStyle}>Icon (emoji)</label>
                <input value={addForm.icon} onChange={e => setAddForm({ ...addForm, icon: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Mode</label>
                <select value={addForm.mode} onChange={e => setAddForm({ ...addForm, mode: e.target.value as "test" | "live" })} style={inputStyle}>
                  <option value="test">test</option>
                  <option value="live">live</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Sort order (lower = earlier)</label>
                <input type="number" value={addForm.sort} onChange={e => setAddForm({ ...addForm, sort: Number(e.target.value) })} style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Description</label>
                <input value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })} style={inputStyle} placeholder="Shown to customers at checkout" />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Credentials (never shown to customers; masked after save)</label>
              {addCreds.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input placeholder="Key (e.g. appId)" value={c.key} onChange={e => setAddCreds(addCreds.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} style={{ ...inputStyle, maxWidth: 220 }} />
                  <input placeholder="Value" value={c.value} onChange={e => setAddCreds(addCreds.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} style={inputStyle} />
                  <button onClick={() => setAddCreds(addCreds.filter((_, j) => j !== i))} style={{ padding: "0 12px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer" }}>✕</button>
                </div>
              ))}
              <button onClick={() => setAddCreds([...addCreds, { key: "", value: "" }])} style={{ fontSize: 12, padding: "6px 12px", border: "1px dashed var(--line)", background: "#fbf9f5", cursor: "pointer" }}>
                + Add credential field
              </button>
            </div>
            <button
              onClick={addGateway}
              disabled={adding}
              style={{ marginTop: 16, padding: "9px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: adding ? "wait" : "pointer", fontSize: 12, fontWeight: 600 }}
            >
              {adding ? "Adding…" : "Add partner"}
            </button>
          </div>
        )}
      </div>

      {globalNotice && (
        <div style={{
          padding: "10px 16px",
          background: globalNotice.isError ? "#fde8e8" : "#e9f7e9",
          color: globalNotice.isError ? "#b34141" : "#2e7d32",
          border: `1px solid ${globalNotice.isError ? "#f8b4b4" : "#c3e6cb"}`,
          fontSize: 13,
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>{globalNotice.text}</span>
          <button onClick={() => setGlobalNotice(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* Gateway Cards Grid */}
      <div style={{ display: "grid", gap: 16 }}>
        {gateways.map((gw) => {
          const isEditing = editingId === gw.id;
          return (
            <div key={gw.id} style={{
              background: "#fff",
              border: gw.enabled ? "1px solid var(--purple)" : "1px solid var(--line)",
              padding: 20,
              boxShadow: gw.enabled ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
              transition: "all .2s ease"
            }}>
              {/* Card Top Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{gw.icon || "💳"}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{gw.displayName}</h4>
                      {/* Status Badge */}
                      {gw.enabled ? (
                        gw.isConfigured ? (
                          <span style={{ fontSize: 10, padding: "2px 8px", background: "#e9f7e9", color: "#2e7d32", border: "1px solid #c3e6cb", textTransform: "uppercase", letterSpacing: ".06em" }}>
                            🟢 Connected
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, padding: "2px 8px", background: "#fff3cd", color: "#856404", border: "1px solid #ffeeba", textTransform: "uppercase", letterSpacing: ".06em" }}>
                            ⚪ Not Configured
                          </span>
                        )
                      ) : (
                        <span style={{ fontSize: 10, padding: "2px 8px", background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb", textTransform: "uppercase", letterSpacing: ".06em" }}>
                          🔴 Disabled
                        </span>
                      )}

                      {/* Mode Badge */}
                      <span style={{ fontSize: 10, padding: "2px 6px", background: gw.mode === "live" ? "var(--purple)" : "#f0f0f0", color: gw.mode === "live" ? "#fff" : "#555", textTransform: "uppercase" }}>
                        {gw.mode} mode
                      </span>
                    </div>
                    {gw.description && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>{gw.description}</p>}
                  </div>
                </div>

                {/* Quick Action Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: gw.enabled ? "#2e7d32" : "#666" }}>
                    <input
                      type="checkbox"
                      checked={gw.enabled}
                      onChange={() => toggleEnabled(gw)}
                      style={{ width: 16, height: 16, cursor: "pointer" }}
                    />
                    {gw.enabled ? "Enabled (ON)" : "Disabled (OFF)"}
                  </label>

                  <button
                    onClick={() => isEditing ? closeEdit() : openEdit(gw)}
                    style={{
                      padding: "6px 14px",
                      border: "1px solid var(--line)",
                      background: isEditing ? "var(--purple)" : "#fff",
                      color: isEditing ? "#fff" : "#111",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 500
                    }}
                  >
                    {isEditing ? "Close Editor" : "Configure ⚙️"}
                  </button>

                  <button
                    onClick={() => testConnection(gw.id)}
                    disabled={testingId === gw.id}
                    style={{
                      padding: "6px 14px",
                      border: "1px solid var(--line)",
                      background: "#fff",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "var(--purple)"
                    }}
                  >
                    {testingId === gw.id ? "Testing…" : "Test Connection 🔌"}
                  </button>

                  {gw.provider !== "cod" && (
                    <button
                      onClick={() => deleteGateway(gw)}
                      disabled={deletingId === gw.id}
                      title="Delete this payment partner"
                      style={{
                        padding: "6px 12px",
                        border: "1px solid #f8b4b4",
                        background: "#fff",
                        cursor: deletingId === gw.id ? "wait" : "pointer",
                        fontSize: 12,
                        color: "#b34141"
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Test Result Message Box */}
              {testResult && testResult.id === gw.id && (
                <div style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  background: testResult.success ? "#e9f7e9" : "#fde8e8",
                  color: testResult.success ? "#2e7d32" : "#b34141",
                  border: `1px solid ${testResult.success ? "#c3e6cb" : "#f8b4b4"}`,
                  fontSize: 12
                }}>
                  <b>{testResult.success ? "✓ Test Passed: " : "✕ Connection Notice: "}</b> {testResult.message}
                </div>
              )}

              {/* Expanded Configuration Form */}
              {isEditing && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
                  <h4 style={{ margin: "0 0 16px", fontSize: 14, font: "16px var(--font-display)", color: "var(--purple)" }}>
                    Configure {gw.displayName}
                  </h4>

                  <div style={{ display: "grid", gap: 14 }}>
                    {/* General Details */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Display Name (Shown at Checkout) *</label>
                        <input
                          style={inputStyle}
                          value={editForm.displayName || ""}
                          onChange={e => setEditForm({ ...editForm, displayName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Environment Mode</label>
                        <select
                          style={inputStyle}
                          value={editForm.mode || "test"}
                          onChange={e => setEditForm({ ...editForm, mode: e.target.value as "test" | "live" })}
                        >
                          <option value="test">Test / Sandbox Mode</option>
                          <option value="live">Live / Production Mode</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Priority / Sort Order</label>
                        <input
                          type="number"
                          style={inputStyle}
                          value={editForm.sort ?? 1}
                          onChange={e => setEditForm({ ...editForm, sort: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Customer Description / Help Text</label>
                      <input
                        style={inputStyle}
                        value={editForm.description || ""}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="e.g. Pay via Google Pay, PhonePe, Cards, Netbanking"
                      />
                    </div>

                    {/* Specific Provider Credential Fields */}
                    {gw.provider === "razorpay" && (
                      <div style={{ padding: 16, background: "#fcfbf9", border: "1px solid var(--line)", display: "grid", gap: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)" }}>Razorpay API Credentials</span>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>Found in Razorpay Dashboard → Settings → API Keys</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={labelStyle}>Key ID (e.g. rzp_test_... or rzp_live_...) *</label>
                            <input
                              style={inputStyle}
                              value={editCreds.keyId || ""}
                              onChange={e => setEditCreds({ ...editCreds, keyId: e.target.value })}
                              placeholder="rzp_test_xxxxxxxxxxxxxx"
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>
                              Key Secret *
                              <button
                                type="button"
                                onClick={() => setShowSecrets({ ...showSecrets, rzp_sec: !showSecrets.rzp_sec })}
                                style={{ marginLeft: 8, fontSize: 10, background: "none", border: "none", color: "var(--purple)", cursor: "pointer" }}
                              >
                                {showSecrets.rzp_sec ? "Hide" : "Show / Enter New"}
                              </button>
                            </label>
                            <input
                              type={showSecrets.rzp_sec ? "text" : "password"}
                              style={inputStyle}
                              value={editCreds.keySecret || ""}
                              onChange={e => setEditCreds({ ...editCreds, keySecret: e.target.value })}
                              placeholder="••••••••••••••••"
                            />
                          </div>
                        </div>
                        <div>
                          <label style={labelStyle}>Webhook Secret (Optional)</label>
                          <input
                            style={inputStyle}
                            value={editCreds.webhookSecret || ""}
                            onChange={e => setEditCreds({ ...editCreds, webhookSecret: e.target.value })}
                            placeholder="Webhook secret configured in Razorpay dashboard"
                          />
                        </div>
                      </div>
                    )}

                    {gw.provider === "stripe" && (
                      <div style={{ padding: 16, background: "#fcfbf9", border: "1px solid var(--line)", display: "grid", gap: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)" }}>Stripe API Credentials</span>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>Found in Stripe Dashboard → Developers → API keys</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={labelStyle}>Publishable Key (pk_test_... / pk_live_...) *</label>
                            <input
                              style={inputStyle}
                              value={editCreds.publishableKey || ""}
                              onChange={e => setEditCreds({ ...editCreds, publishableKey: e.target.value })}
                              placeholder="pk_test_xxxxxxxxxxxxxx"
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>
                              Secret Key (sk_test_... / sk_live_...) *
                              <button
                                type="button"
                                onClick={() => setShowSecrets({ ...showSecrets, str_sec: !showSecrets.str_sec })}
                                style={{ marginLeft: 8, fontSize: 10, background: "none", border: "none", color: "var(--purple)", cursor: "pointer" }}
                              >
                                {showSecrets.str_sec ? "Hide" : "Show / Enter New"}
                              </button>
                            </label>
                            <input
                              type={showSecrets.str_sec ? "text" : "password"}
                              style={inputStyle}
                              value={editCreds.secretKey || ""}
                              onChange={e => setEditCreds({ ...editCreds, secretKey: e.target.value })}
                              placeholder="••••••••••••••••"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {gw.provider === "cashfree" && (
                      <div style={{ padding: 16, background: "#fcfbf9", border: "1px solid var(--line)", display: "grid", gap: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)" }}>Cashfree API Credentials</span>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>Cashfree Merchant Dashboard → Developers → API Keys</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={labelStyle}>App ID *</label>
                            <input
                              style={inputStyle}
                              value={editCreds.appId || ""}
                              onChange={e => setEditCreds({ ...editCreds, appId: e.target.value })}
                              placeholder="CF_APP_xxxxxxxx"
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Secret Key *</label>
                            <input
                              type="password"
                              style={inputStyle}
                              value={editCreds.secretKey || ""}
                              onChange={e => setEditCreds({ ...editCreds, secretKey: e.target.value })}
                              placeholder="••••••••••••••••"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {gw.provider === "payu" && (
                      <div style={{ padding: 16, background: "#fcfbf9", border: "1px solid var(--line)", display: "grid", gap: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)" }}>PayU Money Credentials</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={labelStyle}>Merchant Key *</label>
                            <input
                              style={inputStyle}
                              value={editCreds.merchantKey || ""}
                              onChange={e => setEditCreds({ ...editCreds, merchantKey: e.target.value })}
                              placeholder="Merchant Key"
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Merchant Salt *</label>
                            <input
                              type="password"
                              style={inputStyle}
                              value={editCreds.merchantSalt || ""}
                              onChange={e => setEditCreds({ ...editCreds, merchantSalt: e.target.value })}
                              placeholder="••••••••••••••••"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {gw.provider === "phonepe" && (
                      <div style={{ padding: 16, background: "#fcfbf9", border: "1px solid var(--line)", display: "grid", gap: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)" }}>PhonePe PG Credentials</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: 12 }}>
                          <div>
                            <label style={labelStyle}>Merchant ID *</label>
                            <input
                              style={inputStyle}
                              value={editCreds.merchantId || ""}
                              onChange={e => setEditCreds({ ...editCreds, merchantId: e.target.value })}
                              placeholder="M220000000000"
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Salt Key *</label>
                            <input
                              type="password"
                              style={inputStyle}
                              value={editCreds.saltKey || ""}
                              onChange={e => setEditCreds({ ...editCreds, saltKey: e.target.value })}
                              placeholder="••••••••••••••••"
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Salt Index</label>
                            <input
                              style={inputStyle}
                              value={editCreds.saltIndex || "1"}
                              onChange={e => setEditCreds({ ...editCreds, saltIndex: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {gw.provider === "cod" && (
                      <div style={{ padding: 16, background: "#fcfbf9", border: "1px solid var(--line)", display: "grid", gap: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)" }}>Cash on Delivery (COD) Rules</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={labelStyle}>Extra COD Handling Fee (₹)</label>
                            <input
                              type="number"
                              style={inputStyle}
                              value={editForm.codCharge ?? 0}
                              onChange={e => setEditForm({ ...editForm, codCharge: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Min Order Value for COD (₹)</label>
                            <input
                              type="number"
                              style={inputStyle}
                              value={editForm.minOrderValue ?? 0}
                              onChange={e => setEditForm({ ...editForm, minOrderValue: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Max Order Value for COD (₹)</label>
                            <input
                              type="number"
                              style={inputStyle}
                              value={editForm.maxOrderValue ?? 15000}
                              onChange={e => setEditForm({ ...editForm, maxOrderValue: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div>
                          <label style={labelStyle}>Delivery Instructions for Customer</label>
                          <input
                            style={inputStyle}
                            value={editForm.instructions || ""}
                            onChange={e => setEditForm({ ...editForm, instructions: e.target.value })}
                            placeholder="e.g. Please keep exact cash or UPI QR app ready when the courier arrives."
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      <button
                        onClick={saveGateway}
                        disabled={saving}
                        style={{
                          padding: "10px 24px",
                          background: "var(--purple)",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        {saving ? "Saving…" : "Save Configuration →"}
                      </button>

                      <button
                        onClick={() => testConnection(gw.id)}
                        disabled={testingId === gw.id}
                        style={{
                          padding: "10px 20px",
                          background: "#fff",
                          border: "1px solid var(--line)",
                          color: "var(--purple)",
                          cursor: "pointer",
                          fontSize: 12
                        }}
                      >
                        {testingId === gw.id ? "Testing…" : "Test Connection"}
                      </button>

                      <button
                        onClick={closeEdit}
                        style={{
                          padding: "10px 16px",
                          background: "#fff",
                          border: "1px solid var(--line)",
                          color: "var(--muted)",
                          cursor: "pointer",
                          fontSize: 12
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
