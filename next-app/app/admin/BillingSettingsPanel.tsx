"use client";

import { useState, useEffect } from "react";

type BusinessInfo = {
  legalName: string; tradeName: string; tagline?: string;
  address: string; operatingAddress?: string; warehouseAddress?: string;
  city: string; state: string; stateCode: string; pincode: string; country: string;
  phone: string; email: string; supportPhone: string; supportEmail: string;
  businessHours?: string; website: string; logoUrl: string;
  gstin: string; pan: string; cin?: string;
  drugLicenseNo?: string; drugLicenseForm?: string;
  fssaiLicenseNo?: string;
  pharmacistName?: string; pharmacistRegNo?: string;
  grievanceOfficerName?: string; grievanceEmail?: string; grievancePhone?: string; grievanceAddress?: string;
  invoiceFooter: string; invoiceNotes: string; termsAndConditions: string;
  returnsPolicy?: string; cancellationPolicy?: string;
  authorizedSignatoryLabel?: string; signatoryTitle?: string;
};

type BillingSettings = {
  business_info: BusinessInfo;
  tax_config: {
    enabled: boolean; defaultRate: number; taxInclusive: boolean;
    rounding: "nearest" | "up" | "down";
  };
  invoice_config: {
    prefix: string; startingNumber: number; nextNumber: number; format: string;
  };
  other_charges: Array<{
    id: string; name: string; description: string; amount: number;
    type: "fixed" | "percentage"; enabled: boolean;
    taxTreatment: "taxable" | "non_taxable"; gstRate: number;
    automaticallyApplied: boolean; sortOrder: number;
  }>;
  donation_config: {
    enabled: boolean; title: string; description: string; causeName: string;
    causeDescription: string; organizationName: string;
    presetAmounts: number[]; customAmountEnabled: boolean;
    customMin: number; customMax: number; defaultAmount: number;
    displayPosition: string; label: string; thankYouMessage: string;
    taxTreatment: "taxable" | "non_taxable"; gstRate: number;
  };
};

const empty: BillingSettings = {
  business_info: {
    legalName: "", tradeName: "", tagline: "",
    address: "", operatingAddress: "", warehouseAddress: "",
    city: "", state: "", stateCode: "", pincode: "", country: "India",
    phone: "", email: "", supportPhone: "", supportEmail: "",
    businessHours: "", website: "", logoUrl: "",
    gstin: "", pan: "", cin: "",
    drugLicenseNo: "", drugLicenseForm: "",
    fssaiLicenseNo: "",
    pharmacistName: "", pharmacistRegNo: "",
    grievanceOfficerName: "", grievanceEmail: "", grievancePhone: "", grievanceAddress: "",
    invoiceFooter: "", invoiceNotes: "", termsAndConditions: "",
    returnsPolicy: "", cancellationPolicy: "",
    authorizedSignatoryLabel: "", signatoryTitle: "",
  },
  tax_config: { enabled: false, defaultRate: 18, taxInclusive: false, rounding: "nearest" },
  invoice_config: { prefix: "QC/", startingNumber: 1, nextNumber: 1, format: "QC/{year}/{number:6}" },
  other_charges: [],
  donation_config: {
    enabled: false, title: "Support Our Mission", description: "",
    causeName: "", causeDescription: "", organizationName: "",
    presetAmounts: [10, 25, 50, 100, 250, 500],
    customAmountEnabled: true, customMin: 10, customMax: 10000,
    defaultAmount: 0, displayPosition: "before_payment",
    label: "Donation / Contribution", thankYouMessage: "",
    taxTreatment: "non_taxable", gstRate: 0,
  },
};

function ConfigBadge({ value, priority }: { value?: string | number | boolean; priority?: "P0" | "P1" | "P2" }) {
  const str = String(value || "").trim();
  const isFilled = Boolean(str && !str.includes("AAAAQ") && !str.includes("123456"));
  if (isFilled) {
    return (
      <span style={{ fontSize: 10, background: "#f6ffed", color: "#389e0d", border: "1px solid #b7eb8f", padding: "1px 6px", borderRadius: 3, fontWeight: 600, marginLeft: 6 }}>
        ✓ Configured
      </span>
    );
  }
  const color = priority === "P0" ? "#cf1322" : priority === "P1" ? "#d46b08" : "#8c8c8c";
  const bg = priority === "P0" ? "#fff1f0" : priority === "P1" ? "#fff7e6" : "#fafafa";
  const border = priority === "P0" ? "#ffa39e" : priority === "P1" ? "#ffd591" : "#d9d9d9";
  return (
    <span style={{ fontSize: 10, background: bg, color, border: `1px solid ${border}`, padding: "1px 6px", borderRadius: 3, fontWeight: 600, marginLeft: 6 }}>
      {priority ? `${priority}: ` : ""}Not configured
    </span>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid var(--line)", fontSize: 13, background: "#fff", borderRadius: 4 };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", marginBottom: 4, color: "#444" };
const sectionStyle: React.CSSProperties = { background: "#fff", border: "1px solid var(--line)", padding: 24, marginBottom: 24 };

export default function BillingSettingsPanel() {
  const [settings, setSettings] = useState<BillingSettings>(empty);
  const [activeTab, setActiveTab] = useState<"business" | "regulatory" | "tax" | "invoice" | "charges" | "donation">("business");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings/billing");
      const data = await res.json();
      if (data.settings) {
        setSettings({
          business_info: { ...empty.business_info, ...(data.settings.business_info || {}) },
          tax_config: { ...empty.tax_config, ...(data.settings.tax_config || {}) },
          invoice_config: { ...empty.invoice_config, ...(data.settings.invoice_config || {}) },
          other_charges: Array.isArray(data.settings.other_charges) ? data.settings.other_charges : [],
          donation_config: { ...empty.donation_config, ...(data.settings.donation_config || {}) },
        });
      }
    } catch { setNotice({ text: "Failed to load settings.", error: true }); }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const save = async (section: Partial<BillingSettings>) => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/settings/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(section),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice({ text: "Settings saved successfully.", error: false });
        fetchSettings();
      } else {
        setNotice({ text: data.error || "Failed to save.", error: true });
      }
    } catch { setNotice({ text: "Network error.", error: true }); }
    setSaving(false);
  };

  const updateBiz = (k: keyof BusinessInfo, v: string) => setSettings(s => ({ ...s, business_info: { ...s.business_info, [k]: v } }));
  const updateTax = (k: string, v: unknown) => setSettings(s => ({ ...s, tax_config: { ...s.tax_config, [k]: v } }));
  const updateInvoice = (k: string, v: unknown) => setSettings(s => ({ ...s, invoice_config: { ...s.invoice_config, [k]: v } }));
  const updateDonation = (k: string, v: unknown) => setSettings(s => ({ ...s, donation_config: { ...s.donation_config, [k]: v } }));

  const addCharge = () => {
    const id = `charge-${Date.now().toString(36)}`;
    setSettings(s => ({
      ...s,
      other_charges: [...s.other_charges, {
        id, name: "New Charge", description: "", amount: 0,
        type: "fixed", enabled: false, taxTreatment: "non_taxable",
        gstRate: 18, automaticallyApplied: false, sortOrder: s.other_charges.length,
      }],
    }));
  };

  const updateCharge = (idx: number, k: string, v: unknown) => {
    setSettings(s => {
      const charges = [...s.other_charges];
      charges[idx] = { ...charges[idx], [k]: v };
      return { ...s, other_charges: charges };
    });
  };

  const removeCharge = (idx: number) => {
    setSettings(s => ({ ...s, other_charges: s.other_charges.filter((_, i) => i !== idx) }));
  };

  const tabs = [
    { key: "business", label: "Company & Facilities" },
    { key: "regulatory", label: "Regulatory & Compliance" },
    { key: "tax", label: "Tax & GST" },
    { key: "invoice", label: "Invoice" },
    { key: "charges", label: "Other Charges" },
    { key: "donation", label: "Donation" },
  ] as const;

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading billing settings…</p>;

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ background: "#fbf9f5", border: "1px solid var(--line)", padding: "18px 22px", marginBottom: 24 }}>
        <h3 style={{ margin: 0, font: "18px var(--font-display)", color: "var(--purple)" }}>
          🏥 Company, Regulatory &amp; Billing Settings
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
          Manage official corporate details, statutory pharmaceutical licenses, GSTIN, in-house pharmacist verification, and customer invoice templates. Unconfigured items remain safely hidden from public customer views until provided.
        </p>
      </div>

      {notice && (
        <div style={{
          padding: "10px 16px", marginBottom: 20,
          background: notice.error ? "#fde8e8" : "#e9f7e9",
          color: notice.error ? "#b34141" : "#2e7d32",
          border: `1px solid ${notice.error ? "#f8b4b4" : "#c3e6cb"}`,
          fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--line)", marginBottom: 24, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: "10px 18px", background: "none", border: "none", borderBottom: activeTab === t.key ? "2.5px solid var(--purple)" : "2.5px solid transparent",
            color: activeTab === t.key ? "var(--purple)" : "#777", fontWeight: 700, fontSize: 12, cursor: "pointer", textTransform: "uppercase", letterSpacing: ".08em", whiteSpace: "nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      {/* COMPANY & FACILITIES TAB */}
      {activeTab === "business" && (
        <div style={sectionStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0, font: "16px var(--font-display)", color: "var(--purple)" }}>Corporate &amp; Facility Information</h4>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Official brand and dispatch headquarters</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            <div>
              <label style={labelStyle}>Legal Company Name <ConfigBadge value={settings.business_info.legalName} priority="P1" /></label>
              <input style={inputStyle} value={settings.business_info.legalName} onChange={e => updateBiz("legalName", e.target.value)} placeholder="e.g. Queens Care Laboratories Pvt. Ltd." />
            </div>
            <div>
              <label style={labelStyle}>Trade / Brand Display Name <ConfigBadge value={settings.business_info.tradeName} priority="P1" /></label>
              <input style={inputStyle} value={settings.business_info.tradeName} onChange={e => updateBiz("tradeName", e.target.value)} placeholder="e.g. Queens Care Laboratories" />
            </div>
            <div>
              <label style={labelStyle}>Brand Tagline</label>
              <input style={inputStyle} value={settings.business_info.tagline || ""} onChange={e => updateBiz("tagline", e.target.value)} placeholder="e.g. Science with Soul" />
            </div>
            <div>
              <label style={labelStyle}>Official Website</label>
              <input style={inputStyle} value={settings.business_info.website} onChange={e => updateBiz("website", e.target.value)} placeholder="https://queenscare.in" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Registered Corporate Address <ConfigBadge value={settings.business_info.address} priority="P1" /></label>
              <input style={inputStyle} value={settings.business_info.address} onChange={e => updateBiz("address", e.target.value)} placeholder="Full statutory registered office address" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Warehouse / Operating Dispatch Hub <ConfigBadge value={settings.business_info.warehouseAddress || settings.business_info.operatingAddress} priority="P2" /></label>
              <input style={inputStyle} value={settings.business_info.warehouseAddress || settings.business_info.operatingAddress || ""} onChange={e => updateBiz("warehouseAddress", e.target.value)} placeholder="Formulation & dispatch warehouse facility" />
            </div>
            <div><label style={labelStyle}>City</label><input style={inputStyle} value={settings.business_info.city} onChange={e => updateBiz("city", e.target.value)} /></div>
            <div><label style={labelStyle}>State</label><input style={inputStyle} value={settings.business_info.state} onChange={e => updateBiz("state", e.target.value)} /></div>
            <div><label style={labelStyle}>State Code</label><input style={inputStyle} value={settings.business_info.stateCode} onChange={e => updateBiz("stateCode", e.target.value)} placeholder="e.g. 27 for Maharashtra" /></div>
            <div><label style={labelStyle}>PIN Code</label><input style={inputStyle} value={settings.business_info.pincode} onChange={e => updateBiz("pincode", e.target.value)} /></div>
            <div><label style={labelStyle}>Country</label><input style={inputStyle} value={settings.business_info.country} onChange={e => updateBiz("country", e.target.value)} /></div>
            <div>
              <label style={labelStyle}>Primary Contact Phone <ConfigBadge value={settings.business_info.phone} priority="P1" /></label>
              <input style={inputStyle} value={settings.business_info.phone} onChange={e => updateBiz("phone", e.target.value)} placeholder="+91 ..." />
            </div>
            <div>
              <label style={labelStyle}>Care Support Helpline <ConfigBadge value={settings.business_info.supportPhone} priority="P1" /></label>
              <input style={inputStyle} value={settings.business_info.supportPhone} onChange={e => updateBiz("supportPhone", e.target.value)} placeholder="Helpline shown to customers" />
            </div>
            <div>
              <label style={labelStyle}>Primary Corporate Email <ConfigBadge value={settings.business_info.email} priority="P1" /></label>
              <input style={inputStyle} value={settings.business_info.email} onChange={e => updateBiz("email", e.target.value)} placeholder="contact@queenscare.in" />
            </div>
            <div>
              <label style={labelStyle}>Customer Support Email <ConfigBadge value={settings.business_info.supportEmail} priority="P1" /></label>
              <input style={inputStyle} value={settings.business_info.supportEmail} onChange={e => updateBiz("supportEmail", e.target.value)} placeholder="care@queenscare.in" />
            </div>
            <div>
              <label style={labelStyle}>Operating Support Hours</label>
              <input style={inputStyle} value={settings.business_info.businessHours || ""} onChange={e => updateBiz("businessHours", e.target.value)} placeholder="e.g. Mon-Sat: 9:00 AM - 7:00 PM IST" />
            </div>
            <div>
              <label style={labelStyle}>Official Logo Asset Path</label>
              <input style={inputStyle} value={settings.business_info.logoUrl} onChange={e => updateBiz("logoUrl", e.target.value)} placeholder="/images/brand/queens-care-horizontal-purple.png" />
            </div>
          </div>
          <button onClick={() => save({ business_info: settings.business_info })} disabled={saving}
            style={{ marginTop: 20, padding: "10px 24px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {saving ? "Saving…" : "Save Company Information"}
          </button>
        </div>
      )}

      {/* REGULATORY & STATUTORY COMPLIANCE TAB */}
      {activeTab === "regulatory" && (
        <div style={sectionStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0, font: "16px var(--font-display)", color: "var(--purple)" }}>Statutory &amp; Pharmaceutical Compliance</h4>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Document-first verified licenses</span>
          </div>

          <div style={{ background: "#f8f9fa", border: "1px solid #e9ecef", padding: "12px 16px", borderRadius: 4, marginBottom: 20, fontSize: 12, lineHeight: 1.5, color: "#495057" }}>
            <b>Document-First Rule:</b> Fill these fields ONLY from official government certificates or license documents provided by Queens Care Laboratories. Unconfigured fields are safely omitted from customer-facing storefronts to eliminate false or mock disclosures.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            <div>
              <label style={labelStyle}>
                Goods &amp; Services Tax (GSTIN)
                <ConfigBadge value={settings.business_info.gstin} priority="P0" />
              </label>
              <input style={inputStyle} value={settings.business_info.gstin} onChange={e => updateBiz("gstin", e.target.value)} placeholder="15-digit GSTIN (e.g. 27...)" />
              <span style={{ fontSize: 10, color: "#888", display: "block", marginTop: 2 }}>Required for official B2B/B2C statutory GST invoice filing.</span>
            </div>

            <div>
              <label style={labelStyle}>
                Permanent Account Number (PAN)
                <ConfigBadge value={settings.business_info.pan} priority="P1" />
              </label>
              <input style={inputStyle} value={settings.business_info.pan} onChange={e => updateBiz("pan", e.target.value)} placeholder="10-character PAN" />
            </div>

            <div>
              <label style={labelStyle}>
                Corporate Identification Number (CIN)
                <ConfigBadge value={settings.business_info.cin} priority="P2" />
              </label>
              <input style={inputStyle} value={settings.business_info.cin || ""} onChange={e => updateBiz("cin", e.target.value)} placeholder="21-character MCA CIN" />
            </div>

            <div>
              <label style={labelStyle}>
                Wholesale / Retail Drug License No.
                <ConfigBadge value={settings.business_info.drugLicenseNo} priority="P1" />
              </label>
              <input style={inputStyle} value={settings.business_info.drugLicenseNo || ""} onChange={e => updateBiz("drugLicenseNo", e.target.value)} placeholder="e.g. MH-MZ2-XXXXXX (Form 20B/21B)" />
            </div>

            <div>
              <label style={labelStyle}>
                Drug Licensing State / Authority
              </label>
              <input style={inputStyle} value={settings.business_info.drugLicenseForm || ""} onChange={e => updateBiz("drugLicenseForm", e.target.value)} placeholder="e.g. Food & Drug Administration, Maharashtra" />
            </div>

            <div>
              <label style={labelStyle}>
                FSSAI Central / State License No.
                <ConfigBadge value={settings.business_info.fssaiLicenseNo} priority="P1" />
              </label>
              <input style={inputStyle} value={settings.business_info.fssaiLicenseNo || ""} onChange={e => updateBiz("fssaiLicenseNo", e.target.value)} placeholder="14-digit FSSAI License Number" />
            </div>

            <div>
              <label style={labelStyle}>
                In-House Registered Pharmacist
                <ConfigBadge value={settings.business_info.pharmacistName} priority="P1" />
              </label>
              <input style={inputStyle} value={settings.business_info.pharmacistName || ""} onChange={e => updateBiz("pharmacistName", e.target.value)} placeholder="Pharmacist Name (e.g. Dr. / Ph.)" />
            </div>

            <div>
              <label style={labelStyle}>
                Pharmacist State Council Reg. No.
                <ConfigBadge value={settings.business_info.pharmacistRegNo} priority="P1" />
              </label>
              <input style={inputStyle} value={settings.business_info.pharmacistRegNo || ""} onChange={e => updateBiz("pharmacistRegNo", e.target.value)} placeholder="State Pharmacy Council Reg #" />
            </div>

            <div>
              <label style={labelStyle}>
                Grievance Officer Name
                <ConfigBadge value={settings.business_info.grievanceOfficerName} priority="P1" />
              </label>
              <input style={inputStyle} value={settings.business_info.grievanceOfficerName || ""} onChange={e => updateBiz("grievanceOfficerName", e.target.value)} placeholder="Nodal Grievance Officer" />
              <span style={{ fontSize: 10, color: "#888", display: "block", marginTop: 2 }}>Required under Consumer Protection E-Commerce Rules, 2020.</span>
            </div>

            <div>
              <label style={labelStyle}>
                Grievance Officer Email
                <ConfigBadge value={settings.business_info.grievanceEmail} priority="P1" />
              </label>
              <input style={inputStyle} value={settings.business_info.grievanceEmail || ""} onChange={e => updateBiz("grievanceEmail", e.target.value)} placeholder="grievance@queenscare.in" />
            </div>

            <div>
              <label style={labelStyle}>
                Grievance Direct Contact Phone
              </label>
              <input style={inputStyle} value={settings.business_info.grievancePhone || ""} onChange={e => updateBiz("grievancePhone", e.target.value)} placeholder="Official grievance telephone" />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Grievance Redressal Physical Address</label>
              <input style={inputStyle} value={settings.business_info.grievanceAddress || ""} onChange={e => updateBiz("grievanceAddress", e.target.value)} placeholder="Address for legal notices and consumer complaints" />
            </div>
          </div>

          <button onClick={() => save({ business_info: settings.business_info })} disabled={saving}
            style={{ marginTop: 20, padding: "10px 24px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {saving ? "Saving…" : "Save Regulatory Compliance"}
          </button>
        </div>
      )}

      {/* TAX & GST TAB */}
      {activeTab === "tax" && (
        <div style={sectionStyle}>
          <h4 style={{ margin: "0 0 16px", font: "16px var(--font-display)", color: "var(--purple)" }}>Tax & GST Configuration</h4>
          <div style={{ display: "grid", gap: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={settings.tax_config.enabled} onChange={e => updateTax("enabled", e.target.checked)} style={{ width: 18, height: 18 }} />
              <div><b>Enable GST / Tax</b><p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>When enabled, GST will be calculated on all taxable items and shown on invoices.</p></div>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <div>
                <label style={labelStyle}>Default GST Rate (%)</label>
                <input type="number" style={inputStyle} value={settings.tax_config.defaultRate} onChange={e => updateTax("defaultRate", Number(e.target.value))} min={0} max={100} />
              </div>
              <div>
                <label style={labelStyle}>Tax-Inclusive Pricing</label>
                <select style={inputStyle} value={settings.tax_config.taxInclusive ? "yes" : "no"} onChange={e => updateTax("taxInclusive", e.target.value === "yes")}>
                  <option value="no">Tax-Exclusive (product price + GST)</option>
                  <option value="yes">Tax-Inclusive (GST included in price)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Rounding Method</label>
                <select style={inputStyle} value={settings.tax_config.rounding} onChange={e => updateTax("rounding", e.target.value)}>
                  <option value="nearest">Nearest Rupee</option>
                  <option value="up">Round Up</option>
                  <option value="down">Round Down</option>
                </select>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
              Intra-state: CGST + SGST (half each). Inter-state: IGST (full rate). Place of supply is determined from the shipping state.
              Product-specific rates override the default when set in Product Management.
            </p>
          </div>
          <button onClick={() => save({ tax_config: settings.tax_config })} disabled={saving}
            style={{ marginTop: 16, padding: "10px 24px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {saving ? "Saving…" : "Save Tax Configuration"}
          </button>
        </div>
      )}

      {/* INVOICE TAB */}
      {activeTab === "invoice" && (
        <div style={sectionStyle}>
          <h4 style={{ margin: "0 0 16px", font: "16px var(--font-display)", color: "var(--purple)" }}>Invoice Numbering</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <div><label style={labelStyle}>Invoice Prefix</label><input style={inputStyle} value={settings.invoice_config.prefix} onChange={e => updateInvoice("prefix", e.target.value)} placeholder="QC/" /></div>
            <div><label style={labelStyle}>Starting Number</label><input type="number" style={inputStyle} value={settings.invoice_config.startingNumber} onChange={e => updateInvoice("startingNumber", Number(e.target.value))} min={1} /></div>
            <div><label style={labelStyle}>Next Invoice Number</label><input type="number" style={inputStyle} value={settings.invoice_config.nextNumber} onChange={e => updateInvoice("nextNumber", Number(e.target.value))} min={1} disabled /></div>
          </div>
          <div style={{ marginTop: 20, display: "grid", gap: 14 }}>
            <div><label style={labelStyle}>Invoice Footer Note</label><textarea style={{ ...inputStyle, minHeight: 50 }} value={settings.business_info.invoiceFooter} onChange={e => updateBiz("invoiceFooter", e.target.value)} /></div>
            <div><label style={labelStyle}>Invoice Notes / Computer Generated Notice</label><textarea style={{ ...inputStyle, minHeight: 50 }} value={settings.business_info.invoiceNotes} onChange={e => updateBiz("invoiceNotes", e.target.value)} /></div>
            <div><label style={labelStyle}>Terms &amp; Conditions (Printed on Invoice)</label><textarea style={{ ...inputStyle, minHeight: 70 }} value={settings.business_info.termsAndConditions} onChange={e => updateBiz("termsAndConditions", e.target.value)} /></div>
            <div><label style={labelStyle}>Return &amp; Refund Policy Summary (Printed on Invoice)</label><textarea style={{ ...inputStyle, minHeight: 50 }} value={settings.business_info.returnsPolicy || ""} onChange={e => updateBiz("returnsPolicy", e.target.value)} placeholder="Unopened sealed products may be returned within 7 days of delivery..." /></div>
          </div>
          <button onClick={() => save({ invoice_config: settings.invoice_config, business_info: settings.business_info })} disabled={saving}
            style={{ marginTop: 16, padding: "10px 24px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {saving ? "Saving…" : "Save Invoice Settings & Policies"}
          </button>
        </div>
      )}

      {/* OTHER CHARGES TAB */}
      {activeTab === "charges" && (
        <div style={sectionStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0, font: "16px var(--font-display)", color: "var(--purple)" }}>Additional Charges</h4>
            <button onClick={addCharge} style={{ fontSize: 11, padding: "5px 12px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>
              + Add Charge
            </button>
          </div>
          {settings.other_charges.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--muted)", padding: 20, textAlign: "center", border: "1px dashed #ddd" }}>
              No additional charges configured. Click &ldquo;+ Add Charge&rdquo; to create one.
            </p>
          )}
          {settings.other_charges.map((c, i) => (
            <div key={c.id} style={{ border: "1px solid var(--line)", padding: 16, marginBottom: 12, background: c.enabled ? "#fdfbf7" : "#fafafa" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <div><label style={labelStyle}>Charge Name *</label><input style={inputStyle} value={c.name} onChange={e => updateCharge(i, "name", e.target.value)} /></div>
                <div><label style={labelStyle}>Amount (₹)</label><input type="number" style={inputStyle} value={c.amount} onChange={e => updateCharge(i, "amount", Number(e.target.value))} min={0} /></div>
                <div><label style={labelStyle}>Type</label>
                  <select style={inputStyle} value={c.type} onChange={e => updateCharge(i, "type", e.target.value)}>
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">% of Subtotal</option>
                  </select>
                </div>
                <div><label style={labelStyle}>Tax Treatment</label>
                  <select style={inputStyle} value={c.taxTreatment} onChange={e => updateCharge(i, "taxTreatment", e.target.value)}>
                    <option value="non_taxable">Non-Taxable</option>
                    <option value="taxable">Taxable (GST applies)</option>
                  </select>
                </div>
                <div><label style={labelStyle}>GST Rate (%)</label><input type="number" style={inputStyle} value={c.gstRate} onChange={e => updateCharge(i, "gstRate", Number(e.target.value))} min={0} max={100} disabled={c.taxTreatment !== "taxable"} /></div>
                <div><label style={labelStyle}>Description</label><input style={inputStyle} value={c.description} onChange={e => updateCharge(i, "description", e.target.value)} /></div>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10, alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={c.enabled} onChange={e => updateCharge(i, "enabled", e.target.checked)} />
                  Enabled
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={c.automaticallyApplied} onChange={e => updateCharge(i, "automaticallyApplied", e.target.checked)} />
                  Auto-apply to all orders
                </label>
                <button onClick={() => removeCharge(i)} style={{ marginLeft: "auto", fontSize: 11, padding: "4px 10px", border: "1px solid #b34141", background: "#fff", color: "#b34141", cursor: "pointer" }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => save({ other_charges: settings.other_charges })} disabled={saving}
            style={{ marginTop: 8, padding: "10px 24px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {saving ? "Saving…" : "Save Charges"}
          </button>
        </div>
      )}

      {/* DONATION TAB */}
      {activeTab === "donation" && (
        <div style={sectionStyle}>
          <h4 style={{ margin: "0 0 16px", font: "16px var(--font-display)", color: "var(--purple)" }}>Donation Feature</h4>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer", marginBottom: 16 }}>
            <input type="checkbox" checked={settings.donation_config.enabled} onChange={e => updateDonation("enabled", e.target.checked)} style={{ width: 18, height: 18 }} />
            <div><b>Enable Donation at Checkout</b><p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>When disabled, donation UI is hidden from checkout and donation amounts are rejected server-side.</p></div>
          </label>
          {settings.donation_config.enabled && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                <div><label style={labelStyle}>Title</label><input style={inputStyle} value={settings.donation_config.title} onChange={e => updateDonation("title", e.target.value)} /></div>
                <div><label style={labelStyle}>Cause / Organization Name</label><input style={inputStyle} value={settings.donation_config.causeName} onChange={e => updateDonation("causeName", e.target.value)} /></div>
              </div>
              <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={settings.donation_config.description} onChange={e => updateDonation("description", e.target.value)} /></div>
              <div><label style={labelStyle}>Thank You Message</label><input style={inputStyle} value={settings.donation_config.thankYouMessage} onChange={e => updateDonation("thankYouMessage", e.target.value)} /></div>
              <div><label style={labelStyle}>Customer-Facing Label</label><input style={inputStyle} value={settings.donation_config.label} onChange={e => updateDonation("label", e.target.value)} /></div>
              <div>
                <label style={labelStyle}>Preset Amounts (comma-separated ₹)</label>
                <input style={inputStyle} value={settings.donation_config.presetAmounts.join(", ")}
                  onChange={e => updateDonation("presetAmounts", e.target.value.split(",").map(s => Math.max(0, Math.round(Number(s.trim()) || 0))).filter(n => n > 0))} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={settings.donation_config.customAmountEnabled} onChange={e => updateDonation("customAmountEnabled", e.target.checked)} />
                Allow Custom Amount
              </label>
              {settings.donation_config.customAmountEnabled && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div><label style={labelStyle}>Minimum (₹)</label><input type="number" style={inputStyle} value={settings.donation_config.customMin} onChange={e => updateDonation("customMin", Number(e.target.value))} min={1} /></div>
                  <div><label style={labelStyle}>Maximum (₹)</label><input type="number" style={inputStyle} value={settings.donation_config.customMax} onChange={e => updateDonation("customMax", Number(e.target.value))} min={1} /></div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div><label style={labelStyle}>Tax Treatment</label>
                  <select style={inputStyle} value={settings.donation_config.taxTreatment} onChange={e => updateDonation("taxTreatment", e.target.value)}>
                    <option value="non_taxable">Non-Taxable</option>
                    <option value="taxable">Taxable (GST applies)</option>
                  </select>
                </div>
                <div><label style={labelStyle}>GST Rate (%)</label><input type="number" style={inputStyle} value={settings.donation_config.gstRate} onChange={e => updateDonation("gstRate", Number(e.target.value))} min={0} max={100} disabled={settings.donation_config.taxTreatment !== "taxable"} /></div>
              </div>
            </div>
          )}
          <button onClick={() => save({ donation_config: settings.donation_config })} disabled={saving}
            style={{ marginTop: 16, padding: "10px 24px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {saving ? "Saving…" : "Save Donation Settings"}
          </button>
        </div>
      )}
    </div>
  );
}
