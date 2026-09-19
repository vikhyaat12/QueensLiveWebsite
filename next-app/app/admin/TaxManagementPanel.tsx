"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "./components/shared";

interface TaxRule {
  id: string;
  name: string;
  description?: string;
  gstRate: number;
  taxCategory: "goods" | "services" | "pharmaceuticals" | "medical_devices" | "exempt";
  hsnCodes?: string[];
  isDefault?: boolean;
  active: boolean;
  productCount?: number;
  orderCount?: number;
}

interface TaxConfig {
  businessGstin: string;
  businessState: string;
  defaultGstRate: number;
  inclusivePricingDefault: boolean;
  shippingTaxable: boolean;
  shippingGstRate: number;
  rounding: "round" | "floor" | "ceil" | "none";
  isCompositionScheme: boolean;
}

export function TaxManagementPanel() {
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [taxConfig, setTaxConfig] = useState<TaxConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<TaxRule> | null>(null);
  const [configSaving, setConfigSaving] = useState(false);

  // Live Tax Simulator State
  const [simPrice, setSimPrice] = useState<number>(1000);
  const [simRuleId, setSimRuleId] = useState<string>("");
  const [simInclusive, setSimInclusive] = useState<boolean>(true);
  const [simDestState, setSimDestState] = useState<string>("Maharashtra");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tax");
      const data = await res.json();
      if (res.ok) {
        setRules(data.rules || []);
        setTaxConfig(data.taxConfig || null);
        if (!simRuleId && data.rules?.length > 0) {
          const def = data.rules.find((r: TaxRule) => r.isDefault) || data.rules[0];
          setSimRuleId(def.id);
        }
      } else {
        setMessage(data.error || "Failed to load tax rules.");
        setIsError(true);
      }
    } catch {
      setMessage("Network error loading tax data.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    try {
      const res = await fetch("/api/admin/tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRule),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Tax rule "${data.rule.name}" saved successfully.`);
        setIsError(false);
        setEditingRule(null);
        loadData();
      } else {
        setMessage(data.error || "Failed to save rule.");
        setIsError(true);
      }
    } catch {
      setMessage("Network error saving tax rule.");
      setIsError(true);
    }
  };

  const handleRetireRule = async (rule: TaxRule) => {
    const isUsed = (rule.productCount || 0) > 0 || (rule.orderCount || 0) > 0;
    const confirmMsg = isUsed
      ? `Rule "${rule.name}" is referenced by ${rule.productCount || 0} product(s) and ${rule.orderCount || 0} order(s).\n\nTo preserve historical GST audit integrity, this rule will be RETIRED (deactivated) rather than deleted. Existing records will remain safe.\n\nProceed?`
      : `Are you sure you want to delete "${rule.name}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/tax?id=${encodeURIComponent(rule.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        if (data.retiredOnly) {
          setMessage(`Rule "${rule.name}" was safely retired (deactivated) to protect audit history.`);
        } else {
          setMessage(`Rule "${rule.name}" deleted successfully.`);
        }
        setIsError(false);
        loadData();
      } else {
        setMessage(data.error || "Failed to remove tax rule.");
        setIsError(true);
      }
    } catch {
      setMessage("Network error retiring tax rule.");
      setIsError(true);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxConfig) return;
    setConfigSaving(true);

    try {
      const res = await fetch("/api/admin/tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_tax_config",
          taxConfig,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Business tax configuration updated successfully.");
        setIsError(false);
        setTaxConfig(data.taxConfig);
      } else {
        setMessage(data.error || "Failed to update tax configuration.");
        setIsError(true);
      }
    } catch {
      setMessage("Network error saving configuration.");
      setIsError(true);
    } finally {
      setConfigSaving(false);
    }
  };

  // Simulator calculation
  const simCalculation = useMemo(() => {
    const selectedRule = rules.find((r) => r.id === simRuleId) || rules[0];
    const rate = selectedRule ? selectedRule.gstRate : 12;
    const isIntra = simDestState.toLowerCase() === (taxConfig?.businessState || "maharashtra").toLowerCase();

    let taxable = 0;
    let gst = 0;
    let buyerTotal = 0;

    if (simInclusive) {
      taxable = Math.round((simPrice / (1 + rate / 100)) * 100) / 100;
      gst = Math.round((simPrice - taxable) * 100) / 100;
      buyerTotal = simPrice;
    } else {
      taxable = simPrice;
      gst = Math.round((simPrice * (rate / 100)) * 100) / 100;
      buyerTotal = taxable + gst;
    }

    const cgst = isIntra ? Math.round((gst / 2) * 100) / 100 : 0;
    const sgst = isIntra ? Math.round((gst - cgst) * 100) / 100 : 0;
    const igst = !isIntra ? gst : 0;

    return {
      rate,
      isIntra,
      taxable,
      gst,
      cgst,
      sgst,
      igst,
      buyerTotal,
    };
  }, [simPrice, simRuleId, simInclusive, simDestState, rules, taxConfig]);

  if (loading) {
    return <div style={{ padding: 24, color: "var(--muted)" }}>Loading Tax & GST Configuration...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1200 }}>
      {/* ─── TITLE & BANNER ─── */}
      <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 style={{ margin: "0 0 6px", font: "24px var(--font-display)", color: "var(--purple)" }}>
              GST & Healthcare Tax Engine
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", maxWidth: 750, lineHeight: 1.5 }}>
              Centralized tax rule repository compliant with Indian Goods & Services Tax rules. Supports automatic intra-state
              (CGST + SGST 50/50 split) and inter-state (IGST) determination, tax-inclusive and tax-exclusive pricing,
              custom HSN codes, and audit-safe non-destructive retirement.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setEditingRule({
                name: "",
                gstRate: 12,
                taxCategory: "pharmaceuticals",
                hsnCodes: ["3004"],
                active: true,
                isDefault: false,
                description: "",
              })
            }
            style={{
              padding: "10px 18px",
              background: "var(--purple)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>+</span> Create Tax Rule
          </button>
        </div>

        {message && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 16px",
              borderRadius: 6,
              fontSize: 13,
              background: isError ? "#fdeded" : "#edf7ed",
              color: isError ? "#5f2120" : "#1e4620",
              border: `1px solid ${isError ? "#f5c2c7" : "#c3e6cb"}`,
            }}
          >
            {message}
          </div>
        )}
      </div>

      {/* ─── MODAL / DRAWER: EDIT OR ADD RULE ─── */}
      {editingRule && (
        <div
          style={{
            background: "#fff",
            border: "2px solid var(--purple)",
            borderRadius: 8,
            padding: 24,
            boxShadow: "0 8px 24px rgba(42,15,58,0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, color: "var(--purple)" }}>
              {editingRule.id ? "Edit Tax Rule" : "Create New Tax Rule"}
            </h3>
            <button
              type="button"
              onClick={() => setEditingRule(null)}
              style={{ background: "transparent", border: "none", fontSize: 18, cursor: "pointer", color: "#888" }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveRule} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Rule Name *</label>
              <input
                type="text"
                required
                value={editingRule.name || ""}
                onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                placeholder="e.g. Standard Formulation GST 12%"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                GST Rate (%) * (e.g. 0, 5, 12, 18, 28)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                value={editingRule.gstRate !== undefined ? editingRule.gstRate : 12}
                onChange={(e) => setEditingRule({ ...editingRule, gstRate: parseFloat(e.target.value) || 0 })}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tax Category</label>
              <select
                value={editingRule.taxCategory || "pharmaceuticals"}
                onChange={(e) => setEditingRule({ ...editingRule, taxCategory: e.target.value as TaxRule["taxCategory"] })}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4 }}
              >
                <option value="pharmaceuticals">Pharmaceuticals (Medicines)</option>
                <option value="medical_devices">Medical Devices & Diagnostic Kits</option>
                <option value="goods">General Healthcare & Cosmetics</option>
                <option value="exempt">Exempt / Life Saving</option>
                <option value="services">Services / Teleconsultation</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                HSN Codes (comma separated)
              </label>
              <input
                type="text"
                value={Array.isArray(editingRule.hsnCodes) ? editingRule.hsnCodes.join(", ") : editingRule.hsnCodes || ""}
                onChange={(e) =>
                  setEditingRule({
                    ...editingRule,
                    hsnCodes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="e.g. 3004, 3003"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4 }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Description / Purpose</label>
              <input
                type="text"
                value={editingRule.description || ""}
                onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                placeholder="Internal accounting note e.g. Standard Schedule H medicines and oral dosage forms"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4 }}
              />
            </div>

            <div style={{ display: "flex", gap: 24, alignItems: "center", gridColumn: "1 / -1", paddingTop: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={editingRule.active !== false}
                  onChange={(e) => setEditingRule({ ...editingRule, active: e.target.checked })}
                />
                Rule is Active
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={Boolean(editingRule.isDefault)}
                  onChange={(e) => setEditingRule({ ...editingRule, isDefault: e.target.checked })}
                />
                Default Tax Rule (Applied to new products automatically)
              </label>
            </div>

            {/* Split Preview */}
            <div
              style={{
                gridColumn: "1 / -1",
                background: "#f9f7fa",
                border: "1px dashed #d8cfdc",
                borderRadius: 6,
                padding: "12px 16px",
                fontSize: 12,
                color: "#4a3556",
              }}
            >
              <strong>Live GST Split Preview:</strong> For a ₹1,000 net product:
              {" • "}Intra-state (same state): CGST = {Number(editingRule.gstRate || 0) / 2}% (₹{((1000 * Number(editingRule.gstRate || 0)) / 200).toFixed(2)}) + SGST = {Number(editingRule.gstRate || 0) / 2}% (₹{((1000 * Number(editingRule.gstRate || 0)) / 200).toFixed(2)})
              {" • "}Inter-state: IGST = {Number(editingRule.gstRate || 0)}% (₹{((1000 * Number(editingRule.gstRate || 0)) / 100).toFixed(2)}).
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                style={{ padding: "8px 16px", background: "#f0f0f0", border: "1px solid var(--line)", borderRadius: 4, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: "8px 20px", background: "var(--purple)", color: "#fff", border: "none", borderRadius: 4, fontWeight: 600, cursor: "pointer" }}
              >
                Save Tax Rule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── TAX RULES TABLE ─── */}
      <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", background: "#faf8fb" }}>
          <h3 style={{ margin: 0, fontSize: 16, color: "var(--purple)" }}>Active Tax Rules Repository</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f5f3f7", borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                <th style={{ padding: "12px 16px" }}>Rule Name</th>
                <th style={{ padding: "12px 16px" }}>GST Rate</th>
                <th style={{ padding: "12px 16px" }}>Intra-State Split</th>
                <th style={{ padding: "12px 16px" }}>Inter-State</th>
                <th style={{ padding: "12px 16px" }}>HSN Codes</th>
                <th style={{ padding: "12px 16px" }}>Category</th>
                <th style={{ padding: "12px 16px" }}>Usage</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const isDef = Boolean(rule.isDefault);
                const halfRate = (rule.gstRate / 2).toFixed(1);
                return (
                  <tr key={rule.id} style={{ borderBottom: "1px solid #f0edf2" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "var(--purple)", display: "flex", alignItems: "center", gap: 6 }}>
                        {rule.name}
                        {isDef && (
                          <span style={{ fontSize: 10, background: "#f3e8ff", color: "#6b21a8", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                            DEFAULT
                          </span>
                        )}
                      </div>
                      {rule.description && (
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{rule.description}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 14 }}>
                      {rule.gstRate}%
                    </td>
                    <td style={{ padding: "12px 16px", color: "#444" }}>
                      CGST {halfRate}% + SGST {halfRate}%
                    </td>
                    <td style={{ padding: "12px 16px", color: "#444" }}>
                      IGST {rule.gstRate}%
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <code style={{ fontSize: 11, background: "#f4f1f5", padding: "2px 6px", borderRadius: 3 }}>
                        {rule.hsnCodes?.join(", ") || "3004"}
                      </code>
                    </td>
                    <td style={{ padding: "12px 16px", textTransform: "capitalize", color: "#555" }}>
                      {rule.taxCategory.replace("_", " ")}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>
                      <span title="Products using this rule">🏷️ {rule.productCount || 0}</span>
                      {" / "}
                      <span title="Orders with this rule">📦 {rule.orderCount || 0}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge status={rule.active ? "approved" : "cancelled"} />
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setEditingRule(rule)}
                          style={{
                            padding: "4px 10px",
                            fontSize: 11,
                            background: "var(--purple)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRetireRule(rule)}
                          title="Safely deactivate/retire rule"
                          style={{
                            padding: "4px 10px",
                            fontSize: 11,
                            background: "#fee2e2",
                            color: "#991b1b",
                            border: "1px solid #fca5a5",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          {(rule.productCount || 0) > 0 || (rule.orderCount || 0) > 0 ? "Retire" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── BUSINESS TAX CONFIGURATION & INTERACTIVE SIMULATOR ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Form: Business Tax Settings */}
        {taxConfig && (
          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16, color: "var(--purple)" }}>
              Nexus & Business Tax Settings
            </h3>
            <form onSubmit={handleSaveConfig} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Company GSTIN
                </label>
                <input
                  type="text"
                  value={taxConfig.businessGstin || ""}
                  onChange={(e) => setTaxConfig({ ...taxConfig, businessGstin: e.target.value.toUpperCase() })}
                  placeholder="27AABCQ1234F1Z5"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Place of Origin State (Tax Nexus)
                </label>
                <input
                  type="text"
                  value={taxConfig.businessState || ""}
                  onChange={(e) => setTaxConfig({ ...taxConfig, businessState: e.target.value })}
                  placeholder="Maharashtra"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4 }}
                />
                <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "block" }}>
                  Orders shipped to this state trigger CGST + SGST. Shipments outside this state trigger IGST.
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Store Price Display Default
                  </label>
                  <select
                    value={taxConfig.inclusivePricingDefault ? "inclusive" : "exclusive"}
                    onChange={(e) => setTaxConfig({ ...taxConfig, inclusivePricingDefault: e.target.value === "inclusive" })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4 }}
                  >
                    <option value="inclusive">GST-Inclusive (Price includes tax)</option>
                    <option value="exclusive">GST-Exclusive (Tax added on top)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Invoice Rounding Method
                  </label>
                  <select
                    value={taxConfig.rounding || "round"}
                    onChange={(e) => setTaxConfig({ ...taxConfig, rounding: e.target.value as TaxConfig["rounding"] })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4 }}
                  >
                    <option value="round">Nearest ₹1.00 (Standard)</option>
                    <option value="floor">Round Down (Floor)</option>
                    <option value="ceil">Round Up (Ceil)</option>
                    <option value="none">No Rounding (Exact decimals)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(taxConfig.shippingTaxable)}
                      onChange={(e) => setTaxConfig({ ...taxConfig, shippingTaxable: e.target.checked })}
                    />
                    Charge GST on Shipping
                  </label>
                </div>

                {taxConfig.shippingTaxable && (
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                      Shipping GST Rate (%)
                    </label>
                    <input
                      type="number"
                      value={taxConfig.shippingGstRate || 18}
                      onChange={(e) => setTaxConfig({ ...taxConfig, shippingGstRate: Number(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 4 }}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={configSaving}
                style={{
                  marginTop: 6,
                  padding: "10px 18px",
                  background: "var(--purple)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontWeight: 600,
                  cursor: configSaving ? "not-allowed" : "pointer",
                }}
              >
                {configSaving ? "Saving..." : "Save Business Tax Settings"}
              </button>
            </form>
          </div>
        )}

        {/* Live GST Calculation Simulator */}
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: 20 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, color: "var(--purple)" }}>
            Live Tax Calculation Simulator
          </h3>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--muted)" }}>
            Simulate how the server pricing engine calculates taxes, taxable values, and buyer totals for any product price.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Test Price (₹)</label>
              <input
                type="number"
                value={simPrice}
                onChange={(e) => setSimPrice(Number(e.target.value) || 0)}
                style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 4 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Tax Rule</label>
              <select
                value={simRuleId}
                onChange={(e) => setSimRuleId(e.target.value)}
                style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 4 }}
              >
                {rules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.gstRate}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Pricing Mode</label>
              <select
                value={simInclusive ? "inclusive" : "exclusive"}
                onChange={(e) => setSimInclusive(e.target.value === "inclusive")}
                style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 4 }}
              >
                <option value="inclusive">GST-Inclusive</option>
                <option value="exclusive">GST-Exclusive</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Buyer State</label>
              <select
                value={simDestState}
                onChange={(e) => setSimDestState(e.target.value)}
                style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 4 }}
              >
                <option value="Maharashtra">Maharashtra (Intra-State / CGST+SGST)</option>
                <option value="Karnataka">Karnataka (Inter-State / IGST)</option>
                <option value="Delhi">Delhi (Inter-State / IGST)</option>
                <option value="Gujarat">Gujarat (Inter-State / IGST)</option>
              </select>
            </div>
          </div>

          {/* Breakdown Card */}
          <div style={{ background: "#f7f5f9", borderRadius: 6, padding: 16, border: "1px solid #e7dfee" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
              <span>Base Taxable Value:</span>
              <strong>₹{simCalculation.taxable.toFixed(2)}</strong>
            </div>

            {simCalculation.isIntra ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12, color: "#6b5b75" }}>
                  <span>CGST ({(simCalculation.rate / 2).toFixed(1)}%):</span>
                  <span>+₹{simCalculation.cgst.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#6b5b75" }}>
                  <span>SGST ({(simCalculation.rate / 2).toFixed(1)}%):</span>
                  <span>+₹{simCalculation.sgst.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#6b5b75" }}>
                <span>IGST ({simCalculation.rate}%):</span>
                <span>+₹{simCalculation.igst.toFixed(2)}</span>
              </div>
            )}

            <div style={{ borderTop: "1px dashed #d1c4d9", paddingTop: 8, marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <strong>Total Customer Pays:</strong>
              <strong style={{ color: "var(--purple)" }}>₹{simCalculation.buyerTotal.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
