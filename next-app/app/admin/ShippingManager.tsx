"use client";

import { useState, useEffect } from "react";

type ShippingProvider = {
  id: string;
  provider: string;
  name: string;
  description?: string;
  icon?: string;
  mode: "test" | "live";
  enabled: boolean;
  isDefault: boolean;
  isConfigured: boolean;
  status: "connected" | "not_configured" | "disabled" | "error";
  sort: number;
  credentials?: Record<string, string>;
};

type ShippingRules = {
  id?: string;
  name?: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  expressShippingFee: number;
  codHandlingFee: number;
  minOrderValue: number;
  maxOrderValue: number;
  estimatedDaysMetro: string;
  estimatedDaysNonMetro: string;
};

const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid var(--line)", fontSize: 13, background: "#fff" };
const labelStyle = { fontSize: 11, fontWeight: 600 as const, display: "block" as const, marginBottom: 4, color: "#444" };

export default function ShippingManager() {
  const [providers, setProviders] = useState<ShippingProvider[]>([]);
  const [rules, setRules] = useState<ShippingRules>({
    freeShippingThreshold: 1500,
    standardShippingFee: 99,
    expressShippingFee: 199,
    codHandlingFee: 0,
    minOrderValue: 0,
    maxOrderValue: 100000,
    estimatedDaysMetro: "2-3 business days",
    estimatedDaysNonMetro: "4-6 business days",
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ShippingProvider>>({});
  const [editCreds, setEditCreds] = useState<Record<string, string>>({});
  const [savingProvider, setSavingProvider] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [globalNotice, setGlobalNotice] = useState<{ text: string; isError: boolean } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ provider: "", name: "", icon: "🚚", description: "", mode: "test" as "test" | "live", sort: 10 });
  const [addCreds, setAddCreds] = useState<Array<{ key: string; value: string }>>([]);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Pin tester
  const [testPin, setTestPin] = useState("");
  const [pinResult, setPinResult] = useState<Record<string, unknown> | null>(null);
  const [pinTesting, setPinTesting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resP, resR] = await Promise.all([
        fetch("/api/admin/shipping/providers"),
        fetch("/api/admin/shipping/rules"),
      ]);
      const dataP = await resP.json();
      const dataR = await resR.json();
      if (Array.isArray(dataP.providers)) setProviders(dataP.providers);
      if (dataR.rules) setRules(dataR.rules);
    } catch {
      setGlobalNotice({ text: "Failed to load shipping data.", isError: true });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEdit = (p: ShippingProvider) => {
    setEditingId(p.id);
    setEditForm({ ...p });
    setEditCreds({ ...(p.credentials || {}) });
    setTestResult(null);
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditForm({});
    setEditCreds({});
    setTestResult(null);
  };

  const toggleEnabled = async (p: ShippingProvider) => {
    const newEnabled = !p.enabled;
    try {
      const res = await fetch("/api/admin/shipping/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, enabled: newEnabled }),
      });
      if (res.ok) {
        setProviders(providers.map(item => item.id === p.id ? { ...item, enabled: newEnabled, status: newEnabled ? (item.isConfigured ? "connected" : "not_configured") : "disabled" } : item));
        setGlobalNotice({ text: `${p.name} is now ${newEnabled ? "enabled" : "disabled"}.`, isError: false });
      }
    } catch {
      setGlobalNotice({ text: "Failed to update provider status.", isError: true });
    }
  };

  const makeDefault = async (p: ShippingProvider) => {
    try {
      const res = await fetch("/api/admin/shipping/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, isDefault: true, enabled: true }),
      });
      if (res.ok) {
        setProviders(providers.map(item => ({
          ...item,
          isDefault: item.id === p.id,
          enabled: item.id === p.id ? true : item.enabled,
        })));
        setGlobalNotice({ text: `${p.name} is now the default shipping provider.`, isError: false });
      }
    } catch {
      setGlobalNotice({ text: "Failed to set default provider.", isError: true });
    }
  };

  const saveProvider = async () => {
    if (!editingId) return;
    setSavingProvider(true);
    try {
      const payload = {
        ...editForm,
        id: editingId,
        credentials: editCreds,
      };
      const res = await fetch("/api/admin/shipping/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (res.ok) {
        setGlobalNotice({ text: "Shipping provider configuration saved!", isError: false });
        closeEdit();
        fetchData();
      } else {
        setGlobalNotice({ text: d.error || "Failed to save shipping provider.", isError: true });
      }
    } catch {
      setGlobalNotice({ text: "Network error while saving.", isError: true });
    }
    setSavingProvider(false);
  };

  const testProviderConnection = async (pId: string) => {
    setTestingId(pId);
    setTestResult(null);
    try {
      const payload: Record<string, unknown> = { id: pId };
      if (editingId === pId) {
        payload.credentials = editCreds;
        payload.mode = editForm.mode;
      }
      const res = await fetch("/api/admin/shipping/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      setTestResult({ id: pId, success: Boolean(d.success), message: d.message || "Test complete." });
      if (d.success) {
        fetchData();
      }
    } catch {
      setTestResult({ id: pId, success: false, message: "Network error during test." });
    }
    setTestingId(null);
  };

  const addProvider = async () => {
    const provider = addForm.provider.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!provider || !addForm.name.trim()) {
      setGlobalNotice({ text: "Provider key and display name are required.", isError: true });
      return;
    }
    setAdding(true);
    setGlobalNotice(null);
    try {
      const credentials = Object.fromEntries(addCreds.filter(c => c.key.trim()).map(c => [c.key.trim(), c.value]));
      const res = await fetch("/api/admin/shipping/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          name: addForm.name.trim(),
          icon: addForm.icon || "🚚",
          description: addForm.description.trim(),
          mode: addForm.mode,
          sort: Number(addForm.sort) || 10,
          enabled: false,
          credentials,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setGlobalNotice({ text: `${addForm.name.trim()} added. Configure credentials, then enable it.`, isError: false });
        setShowAdd(false);
        setAddForm({ provider: "", name: "", icon: "🚚", description: "", mode: "test", sort: 10 });
        setAddCreds([]);
        fetchData();
      } else {
        setGlobalNotice({ text: d.error || "Failed to add the shipping partner.", isError: true });
      }
    } catch {
      setGlobalNotice({ text: "Network error while adding the partner.", isError: true });
    }
    setAdding(false);
  };

  const deleteProvider = async (p: ShippingProvider) => {
    if (p.isDefault) {
      setGlobalNotice({ text: "The default partner cannot be deleted. Set another partner as default first.", isError: true });
      return;
    }
    if (!window.confirm(`Delete the shipping partner “${p.name}”? This cannot be undone.`)) return;
    setDeletingId(p.id);
    try {
      const res = await fetch(`/api/admin/shipping/providers?id=${encodeURIComponent(p.id)}`, { method: "DELETE" });
      const d = await res.json();
      if (res.ok && d.success) {
        setGlobalNotice({ text: `${p.name} deleted.`, isError: false });
        if (editingId === p.id) closeEdit();
        fetchData();
      } else {
        setGlobalNotice({ text: d.error || "Failed to delete the partner.", isError: true });
      }
    } catch {
      setGlobalNotice({ text: "Network error while deleting.", isError: true });
    }
    setDeletingId(null);
  };

  const saveShippingRules = async () => {
    setSavingRules(true);
    setGlobalNotice(null);
    try {
      const res = await fetch("/api/admin/shipping/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rules),
      });
      const d = await res.json();
      if (res.ok) {
        setGlobalNotice({ text: "Shipping rates and rules updated successfully! Public store will reflect changes immediately.", isError: false });
      } else {
        setGlobalNotice({ text: d.error || "Failed to update shipping rules.", isError: true });
      }
    } catch {
      setGlobalNotice({ text: "Network error while saving rules.", isError: true });
    }
    setSavingRules(false);
  };

  const runPinTest = async () => {
    if (!testPin || testPin.length < 6) return;
    setPinTesting(true);
    try {
      const res = await fetch(`/api/shipping/serviceability?pincode=${encodeURIComponent(testPin)}&subtotal=1200`);
      const d = await res.json();
      setPinResult(d);
    } catch {
      setPinResult({ error: "Failed to check serviceability." });
    }
    setPinTesting(false);
  };

  if (loading) {
    return <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading shipping settings…</p>;
  }

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header Info */}
      <div style={{ background: "#fbf9f5", border: "1px solid var(--line)", padding: "18px 22px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, font: "18px var(--font-display)", color: "var(--purple)" }}>Shipping, Logistics & Delivery Rules</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
              Manage shipping aggregators (Shiprocket, Delhivery, etc.) and configure store shipping rates, free delivery thresholds, and delivery estimates.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: 11, padding: "4px 10px", background: "#e9f7e9", color: "#2e7d32", border: "1px solid #c3e6cb" }}>
              🚚 Default: {providers.find(p => p.isDefault)?.name || "Local Engine"}
            </span>
            <button
              onClick={() => setShowAdd(v => !v)}
              style={{ fontSize: 11, padding: "5px 12px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              {showAdd ? "Close" : "+ Add shipping partner"}
            </button>
          </div>
        </div>

        {/* Add new shipping partner */}
        {showAdd && (
          <div style={{ marginTop: 16, padding: 18, background: "#fff", border: "1px solid var(--purple)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label style={labelStyle}>Provider key * <span style={{ fontWeight: 400, color: "var(--muted)" }}>(lowercase id)</span></label>
                <input value={addForm.provider} onChange={e => setAddForm({ ...addForm, provider: e.target.value })} style={inputStyle} placeholder="e.g. bluedart" />
              </div>
              <div>
                <label style={labelStyle}>Display name *</label>
                <input value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} style={inputStyle} placeholder="e.g. Blue Dart Express" />
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
                <input value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Credentials (stored server-side, never exposed to the browser)</label>
              {addCreds.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input placeholder="Key (e.g. apiToken)" value={c.key} onChange={e => setAddCreds(addCreds.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} style={{ ...inputStyle, maxWidth: 220 }} />
                  <input placeholder="Value" value={c.value} onChange={e => setAddCreds(addCreds.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} style={inputStyle} />
                  <button onClick={() => setAddCreds(addCreds.filter((_, j) => j !== i))} style={{ padding: "0 12px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer" }}>✕</button>
                </div>
              ))}
              <button onClick={() => setAddCreds([...addCreds, { key: "", value: "" }])} style={{ fontSize: 12, padding: "6px 12px", border: "1px dashed var(--line)", background: "#fbf9f5", cursor: "pointer" }}>
                + Add credential field
              </button>
            </div>
            <button
              onClick={addProvider}
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

      {/* SECTION 1: SHIPPING RATE & RULE ENGINE */}
      <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 24, marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h4 style={{ margin: 0, font: "18px var(--font-display)", color: "var(--purple)" }}>
            ⚡ Shipping Rates & Rule Engine
          </h4>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>Applies directly to Cart, Checkout, and Product Pages</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Free Shipping Threshold (₹) *</label>
            <input
              type="number"
              style={inputStyle}
              value={rules.freeShippingThreshold}
              onChange={e => setRules({ ...rules, freeShippingThreshold: Number(e.target.value) })}
            />
            <span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginTop: 2 }}>Orders above this get ₹0 shipping</span>
          </div>

          <div>
            <label style={labelStyle}>Standard Flat Shipping Fee (₹) *</label>
            <input
              type="number"
              style={inputStyle}
              value={rules.standardShippingFee}
              onChange={e => setRules({ ...rules, standardShippingFee: Number(e.target.value) })}
            />
            <span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginTop: 2 }}>Charged when below threshold</span>
          </div>

          <div>
            <label style={labelStyle}>Express Shipping Fee (₹)</label>
            <input
              type="number"
              style={inputStyle}
              value={rules.expressShippingFee}
              onChange={e => setRules({ ...rules, expressShippingFee: Number(e.target.value) })}
            />
          </div>

          <div>
            <label style={labelStyle}>COD Handling Surcharge (₹)</label>
            <input
              type="number"
              style={inputStyle}
              value={rules.codHandlingFee}
              onChange={e => setRules({ ...rules, codHandlingFee: Number(e.target.value) })}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Estimated Delivery (Metro Cities)</label>
            <input
              style={inputStyle}
              value={rules.estimatedDaysMetro}
              onChange={e => setRules({ ...rules, estimatedDaysMetro: e.target.value })}
              placeholder="e.g. 2-3 business days"
            />
          </div>

          <div>
            <label style={labelStyle}>Estimated Delivery (Rest of India)</label>
            <input
              style={inputStyle}
              value={rules.estimatedDaysNonMetro}
              onChange={e => setRules({ ...rules, estimatedDaysNonMetro: e.target.value })}
              placeholder="e.g. 4-6 business days"
            />
          </div>
        </div>

        <button
          onClick={saveShippingRules}
          disabled={savingRules}
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
          {savingRules ? "Saving Rules…" : "Save Shipping Rates & Rules →"}
        </button>
      </div>

      {/* SECTION 2: PIN CODE SERVICEABILITY TESTER */}
      <div style={{ background: "#fcfbf9", border: "1px solid var(--line)", padding: 20, marginBottom: 28 }}>
        <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600, color: "var(--purple)" }}>
          📍 Live PIN Code & Serviceability Tester
        </h4>
        <div style={{ display: "flex", gap: 10, alignItems: "center", maxWidth: 450 }}>
          <input
            style={inputStyle}
            placeholder="Enter 6-digit PIN code (e.g. 400001, 110001)"
            value={testPin}
            onChange={e => setTestPin(e.target.value)}
            maxLength={6}
          />
          <button
            onClick={runPinTest}
            disabled={pinTesting || testPin.length < 6}
            style={{
              padding: "9px 18px",
              background: "#fff",
              border: "1px solid var(--line)",
              cursor: "pointer",
              fontSize: 12,
              whiteSpace: "nowrap"
            }}
          >
            {pinTesting ? "Checking…" : "Test PIN"}
          </button>
        </div>

        {pinResult && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#fff", border: "1px solid var(--line)", fontSize: 12 }}>
            <p style={{ margin: 0, color: pinResult.serviceable ? "#2e7d32" : "#b34141", fontWeight: 600 }}>
              {pinResult.serviceable ? "✓ Serviceable" : "✕ Not Serviceable"}: {String(pinResult.message || "")}
            </p>
            {Boolean(pinResult.serviceable) && (
              <div style={{ display: "flex", gap: 16, marginTop: 6, color: "var(--muted)", fontSize: 11 }}>
                <span>Type: <b>{pinResult.isMetro ? "Metro Zone" : "Standard Zone"}</b></span>
                <span>Estimate: <b>{String(pinResult.estimatedDelivery)}</b></span>
                <span>Active Courier: <b>{String(pinResult.courier)}</b></span>
                <span>COD: <b>Available</b></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: SHIPPING PROVIDERS */}
      <h4 style={{ margin: "0 0 16px", font: "18px var(--font-display)", color: "var(--purple)" }}>
        📦 Logistics & Shipping Providers
      </h4>

      <div style={{ display: "grid", gap: 16 }}>
        {providers.map((p) => {
          const isEditing = editingId === p.id;
          return (
            <div key={p.id} style={{
              background: "#fff",
              border: p.isDefault ? "2px solid var(--gold, #b8860b)" : (p.enabled ? "1px solid var(--purple)" : "1px solid var(--line)"),
              padding: 20,
              boxShadow: p.isDefault ? "0 2px 10px rgba(184,134,11,0.1)" : "none"
            }}>
              {/* Card Top Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{p.icon || "🚚"}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{p.name}</h4>
                      {p.isDefault && (
                        <span style={{ fontSize: 10, padding: "2px 8px", background: "var(--gold, #b8860b)", color: "#fff", fontWeight: 700, textTransform: "uppercase" }}>
                          DEFAULT PROVIDER
                        </span>
                      )}
                      {p.enabled ? (
                        p.isConfigured ? (
                          <span style={{ fontSize: 10, padding: "2px 8px", background: "#e9f7e9", color: "#2e7d32", border: "1px solid #c3e6cb", textTransform: "uppercase" }}>
                            🟢 Connected
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, padding: "2px 8px", background: "#fff3cd", color: "#856404", border: "1px solid #ffeeba", textTransform: "uppercase" }}>
                            ⚪ Not Configured
                          </span>
                        )
                      ) : (
                        <span style={{ fontSize: 10, padding: "2px 8px", background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb", textTransform: "uppercase" }}>
                          🔴 Disabled
                        </span>
                      )}

                      <span style={{ fontSize: 10, padding: "2px 6px", background: p.mode === "live" ? "var(--purple)" : "#f0f0f0", color: p.mode === "live" ? "#fff" : "#555", textTransform: "uppercase" }}>
                        {p.mode}
                      </span>
                    </div>
                    {p.description && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>{p.description}</p>}
                  </div>
                </div>

                {/* Card Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {!p.isDefault && p.enabled && (
                    <button
                      onClick={() => makeDefault(p)}
                      style={{
                        padding: "5px 12px",
                        background: "#fff",
                        border: "1px solid var(--gold, #b8860b)",
                        color: "var(--gold, #b8860b)",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    >
                      Make Default ★
                    </button>
                  )}

                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: p.enabled ? "#2e7d32" : "#666" }}>
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={() => toggleEnabled(p)}
                      style={{ width: 16, height: 16, cursor: "pointer" }}
                    />
                    {p.enabled ? "ON" : "OFF"}
                  </label>

                  <button
                    onClick={() => isEditing ? closeEdit() : openEdit(p)}
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
                    {isEditing ? "Close" : "Configure ⚙️"}
                  </button>

                  <button
                    onClick={() => testProviderConnection(p.id)}
                    disabled={testingId === p.id}
                    style={{
                      padding: "6px 14px",
                      border: "1px solid var(--line)",
                      background: "#fff",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "var(--purple)"
                    }}
                  >
                    {testingId === p.id ? "Testing…" : "Test Connection 🔌"}
                  </button>

                  {!p.isDefault && (
                    <button
                      onClick={() => deleteProvider(p)}
                      disabled={deletingId === p.id}
                      title="Delete this shipping partner"
                      style={{
                        padding: "6px 12px",
                        border: "1px solid #f8b4b4",
                        background: "#fff",
                        cursor: deletingId === p.id ? "wait" : "pointer",
                        fontSize: 12,
                        color: "#b34141"
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Test Connection Output */}
              {testResult && testResult.id === p.id && (
                <div style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  background: testResult.success ? "#e9f7e9" : "#fde8e8",
                  color: testResult.success ? "#2e7d32" : "#b34141",
                  border: `1px solid ${testResult.success ? "#c3e6cb" : "#f8b4b4"}`,
                  fontSize: 12
                }}>
                  <b>{testResult.success ? "✓ Test Passed: " : "✕ Notice: "}</b> {testResult.message}
                </div>
              )}

              {/* Edit Provider Form */}
              {isEditing && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
                  <h4 style={{ margin: "0 0 16px", fontSize: 14, font: "16px var(--font-display)", color: "var(--purple)" }}>
                    Configure {p.name}
                  </h4>

                  <div style={{ display: "grid", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Provider Display Name *</label>
                        <input
                          style={inputStyle}
                          value={editForm.name || ""}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Environment Mode</label>
                        <select
                          style={inputStyle}
                          value={editForm.mode || "test"}
                          onChange={e => setEditForm({ ...editForm, mode: e.target.value as "test" | "live" })}
                        >
                          <option value="test">Test / Sandbox</option>
                          <option value="live">Live / Production</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Sort Order</label>
                        <input
                          type="number"
                          style={inputStyle}
                          value={editForm.sort ?? 1}
                          onChange={e => setEditForm({ ...editForm, sort: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    {/* Shiprocket Creds */}
                    {p.provider === "shiprocket" && (
                      <div style={{ padding: 16, background: "#fcfbf9", border: "1px solid var(--line)", display: "grid", gap: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)" }}>Shiprocket API Credentials</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={labelStyle}>Shiprocket Account Email *</label>
                            <input
                              style={inputStyle}
                              value={editCreds.email || ""}
                              onChange={e => setEditCreds({ ...editCreds, email: e.target.value })}
                              placeholder="logistics@queenscare.in"
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Account Password / API Token *</label>
                            <input
                              type="password"
                              style={inputStyle}
                              value={editCreds.password || ""}
                              onChange={e => setEditCreds({ ...editCreds, password: e.target.value })}
                              placeholder="••••••••••••••••"
                            />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={labelStyle}>Pickup Location Name / Warehouse</label>
                            <input
                              style={inputStyle}
                              value={editCreds.pickupLocation || ""}
                              onChange={e => setEditCreds({ ...editCreds, pickupLocation: e.target.value })}
                              placeholder="Primary Warehouse Mumbai"
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Channel ID (Optional)</label>
                            <input
                              style={inputStyle}
                              value={editCreds.channelId || ""}
                              onChange={e => setEditCreds({ ...editCreds, channelId: e.target.value })}
                              placeholder="Custom channel ID if configured"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delhivery Creds */}
                    {p.provider === "delhivery" && (
                      <div style={{ padding: 16, background: "#fcfbf9", border: "1px solid var(--line)", display: "grid", gap: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)" }}>Delhivery Direct Credentials</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={labelStyle}>API Token *</label>
                            <input
                              type="password"
                              style={inputStyle}
                              value={editCreds.apiToken || ""}
                              onChange={e => setEditCreds({ ...editCreds, apiToken: e.target.value })}
                              placeholder="••••••••••••••••"
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Client Name</label>
                            <input
                              style={inputStyle}
                              value={editCreds.clientName || ""}
                              onChange={e => setEditCreds({ ...editCreds, clientName: e.target.value })}
                              placeholder="Queens Care Labs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Shipway Creds */}
                    {p.provider === "shipway" && (
                      <div style={{ padding: 16, background: "#fcfbf9", border: "1px solid var(--line)", display: "grid", gap: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)" }}>Shipway Carrier Credentials</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={labelStyle}>Username *</label>
                            <input
                              style={inputStyle}
                              value={editCreds.username || ""}
                              onChange={e => setEditCreds({ ...editCreds, username: e.target.value })}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>License Key *</label>
                            <input
                              type="password"
                              style={inputStyle}
                              value={editCreds.licenseKey || ""}
                              onChange={e => setEditCreds({ ...editCreds, licenseKey: e.target.value })}
                              placeholder="••••••••••••••••"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pickrr Creds */}
                    {p.provider === "pickrr" && (
                      <div style={{ padding: 16, background: "#fcfbf9", border: "1px solid var(--line)", display: "grid", gap: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)" }}>Pickrr / ClickPost Auth</span>
                        <div>
                          <label style={labelStyle}>Auth Token *</label>
                          <input
                            type="password"
                            style={inputStyle}
                            value={editCreds.authToken || ""}
                            onChange={e => setEditCreds({ ...editCreds, authToken: e.target.value })}
                            placeholder="••••••••••••••••"
                          />
                        </div>
                      </div>
                    )}

                    {/* NimbusPost Creds */}
                    {p.provider === "nimbuspost" && (
                      <div style={{ padding: 16, background: "#fcfbf9", border: "1px solid var(--line)", display: "grid", gap: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)" }}>NimbusPost Credentials</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={labelStyle}>Email *</label>
                            <input
                              style={inputStyle}
                              value={editCreds.email || ""}
                              onChange={e => setEditCreds({ ...editCreds, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Password *</label>
                            <input
                              type="password"
                              style={inputStyle}
                              value={editCreds.password || ""}
                              onChange={e => setEditCreds({ ...editCreds, password: e.target.value })}
                              placeholder="••••••••••••••••"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      <button
                        onClick={saveProvider}
                        disabled={savingProvider}
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
                        {savingProvider ? "Saving…" : "Save Provider →"}
                      </button>

                      <button
                        onClick={() => testProviderConnection(p.id)}
                        disabled={testingId === p.id}
                        style={{
                          padding: "10px 20px",
                          background: "#fff",
                          border: "1px solid var(--line)",
                          color: "var(--purple)",
                          cursor: "pointer",
                          fontSize: 12
                        }}
                      >
                        {testingId === p.id ? "Testing…" : "Test Connection"}
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
