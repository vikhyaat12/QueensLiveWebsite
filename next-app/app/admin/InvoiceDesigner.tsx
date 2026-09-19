"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import type {
  BusinessInfo,
  InvoiceConfig,
  InvoiceColumnsConfig,
  InvoiceTemplateConfig,
  TaxConfig,
  DonationConfig,
  OtherCharge,
} from "@/lib/commerce/pricing-engine";
import { amountInWords } from "@/lib/commerce/number-to-words";

type ActiveTab =
  | "brand"
  | "numbering"
  | "columns"
  | "tax"
  | "charges"
  | "donation"
  | "styling"
  | "terms";

const inr = (n: number) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function InvoiceDesigner() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("brand");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);

  // Settings State
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    legalName: "Queens Care Laboratories",
    tradeName: "Queens Care Laboratories",
    tagline: "Science with Soul",
    address: "",
    city: "",
    state: "",
    stateCode: "",
    pincode: "",
    country: "India",
    phone: "",
    email: "care@queenscare.in",
    website: "https://queenscare.in",
    gstin: "",
    pan: "",
    cin: "",
    logoUrl: "/images/brand/queens-care-horizontal-purple.png",
    logoHeight: 46,
    logoAlignment: "left",
    supportPhone: "",
    supportEmail: "care@queenscare.in",
    invoiceFooter: "Thank you for choosing Queens Care Laboratories. For inquiries: care@queenscare.in",
    invoiceNotes: "Computer generated tax invoice. No physical signature required.",
    termsAndConditions:
      "1. All goods sold are for personal healthcare or prescription-guided care.\n2. Goods once opened cannot be returned due to hygiene and pharmaceutical safety norms.\n3. Discrepancies must be reported within 48 hours of delivery.\n4. Disputes subject to Mumbai jurisdiction.",
    returnsPolicy: "Unopened sealed products may be returned within 7 days of delivery. Refer to queenscare.in/terms.",
    authorizedSignatoryLabel: "Authorized Signatory",
    signatoryTitle: "For QUEENS CARE LABORATORIES",
  });

  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfig>({
    title: "TAX INVOICE",
    subtitle: "Original for Recipient",
    prefix: "QC-INV-",
    startingNumber: 1001,
    nextNumber: 1001,
    format: "QC-INV-{year}/{number:5}",
    dateFormat: "DD/MM/YYYY",
    showInvoiceDate: true,
    showOrderNumber: true,
    showPaymentStatus: true,
    showPaymentMethod: true,
    showPlaceOfSupply: true,
    showStateCode: true,
    showReverseCharge: true,
  });

  const [columnsConfig, setColumnsConfig] = useState<InvoiceColumnsConfig>({
    showProductImage: false,
    showSku: true,
    showHsn: true,
    showQuantity: true,
    showUnitPrice: true,
    showDiscount: true,
    showTaxableValue: true,
    showGstRate: true,
    showCgst: true,
    showSgst: true,
    showIgst: true,
    showLineTotal: true,
  });

  const [templateConfig, setTemplateConfig] = useState<InvoiceTemplateConfig>({
    templateStyle: "default_premium",
    primaryColor: "#2A0F3A",
    accentColor: "#C19A6B",
    fontFamily: "system",
    borderStyle: "elegant",
    showAmountInWords: true,
    showGstBreakupTable: true,
    showTerms: true,
    showSignature: true,
  });

  const [taxConfig, setTaxConfig] = useState<TaxConfig>({
    enabled: true,
    defaultRate: 18,
    taxInclusive: false,
    rounding: "nearest",
  });

  const [donationConfig, setDonationConfig] = useState<DonationConfig>({
    enabled: false,
    title: "Support Our Mission",
    description: "Help us make healthcare accessible to everyone.",
    causeName: "Queens Care Foundation",
    causeDescription: "Providing healthcare to underserved communities.",
    organizationName: "Queens Care Foundation",
    presetAmounts: [10, 25, 50, 100, 250, 500],
    customAmountEnabled: true,
    customMin: 10,
    customMax: 10000,
    defaultAmount: 0,
    displayPosition: "before_payment",
    label: "Donation / Contribution",
    thankYouMessage: "Thank you for your generous contribution!",
    taxTreatment: "non_taxable",
    gstRate: 0,
  });

  const [otherCharges, setOtherCharges] = useState<OtherCharge[]>([]);
  const [availableLogos, setAvailableLogos] = useState<Array<{ label: string; url: string }>>([]);
  const [recentOrders, setRecentOrders] = useState<Array<{ id: string; invoiceNo: string; customerName: string; total: number }>>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("sample");
  const [sampleOrderData, setSampleOrderData] = useState<Record<string, unknown> | null>(null);
  const [realOrderData, setRealOrderData] = useState<Record<string, unknown> | null>(null);

  // Preview zoom & mode state
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const loadDesignerData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/invoice");
        const data = await res.json();
        if (!isMounted) return;
        if (data.settings) {
          if (data.settings.business_info) setBusinessInfo((prev) => ({ ...prev, ...data.settings.business_info }));
          if (data.settings.invoice_config) setInvoiceConfig((prev) => ({ ...prev, ...data.settings.invoice_config }));
          if (data.settings.invoice_columns_config) setColumnsConfig((prev) => ({ ...prev, ...data.settings.invoice_columns_config }));
          if (data.settings.invoice_template_config) setTemplateConfig((prev) => ({ ...prev, ...data.settings.invoice_template_config }));
          if (data.settings.tax_config) setTaxConfig((prev) => ({ ...prev, ...data.settings.tax_config }));
          if (data.settings.donation_config) setDonationConfig((prev) => ({ ...prev, ...data.settings.donation_config }));
          if (Array.isArray(data.settings.other_charges)) setOtherCharges(data.settings.other_charges);
        }
        if (Array.isArray(data.availableLogos)) setAvailableLogos(data.availableLogos);
        if (Array.isArray(data.recentOrders)) setRecentOrders(data.recentOrders);
        if (data.sampleOrder) setSampleOrderData(data.sampleOrder);
      } catch {
        if (isMounted) {
          setNotice({ text: "Failed to load invoice designer settings.", error: true });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadDesignerData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch real order when user selects one
  const handleSelectOrder = async (id: string) => {
    setSelectedOrderId(id);
    if (id === "sample") {
      setRealOrderData(null);
      return;
    }
    try {
      const res = await fetch(`/api/admin/invoice?orderId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.targetOrderData) {
        setRealOrderData(data.targetOrderData);
      }
    } catch {}
  };

  // Save changes to database
  const handleSave = async (isDraft = false) => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/settings/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_info: businessInfo,
          invoice_config: invoiceConfig,
          invoice_columns_config: columnsConfig,
          invoice_template_config: templateConfig,
          tax_config: taxConfig,
          donation_config: donationConfig,
          other_charges: otherCharges,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice({
          text: isDraft ? "Draft settings saved." : "Invoice settings published successfully! Future invoices will use this design.",
          error: false,
        });
      } else {
        setNotice({ text: data.error || "Failed to save settings.", error: true });
      }
    } catch {
      setNotice({ text: "Network error saving settings.", error: true });
    }
    setSaving(false);
  };

  // Reset to Defaults
  const handleReset = () => {
    if (!confirm("Reset invoice template and styling to default Queens Care luxury configuration?")) return;
    setTemplateConfig({
      templateStyle: "default_premium",
      primaryColor: "#2A0F3A",
      accentColor: "#C19A6B",
      fontFamily: "system",
      borderStyle: "elegant",
      showAmountInWords: true,
      showGstBreakupTable: true,
      showTerms: true,
      showSignature: true,
    });
    setColumnsConfig({
      showProductImage: false,
      showSku: true,
      showHsn: true,
      showQuantity: true,
      showUnitPrice: true,
      showDiscount: true,
      showTaxableValue: true,
      showGstRate: true,
      showCgst: true,
      showSgst: true,
      showIgst: true,
      showLineTotal: true,
    });
    setNotice({ text: "Reset to default styling.", error: false });
  };

  // Compile active invoice presentation model for the live preview
  const previewData = useMemo(() => {
    if (selectedOrderId !== "sample" && realOrderData) {
      const snap = (realOrderData as Record<string, unknown>).snapshot as Record<string, unknown> | null;
      const ord = (realOrderData as Record<string, unknown>).order as Record<string, unknown>;
      const shipping = (ord.shipping || {}) as Record<string, unknown>;
      const isIntra = snap?.totalCgst ? Number(snap.totalCgst) > 0 : businessInfo.state === String(shipping.state || "");

      return {
        invoiceNo: String(snap?.invoiceNo || ord.invoiceNo || `QC-INV-${ord.id}`),
        invoiceDate: String(snap?.createdAt || ord.createdAt),
        orderNo: String(ord.id),
        placeOfSupply: String(shipping.state || businessInfo.state),
        isIntraState: isIntra,
        customer: {
          name: String(shipping.fullName || "Customer"),
          email: String(shipping.email || ""),
          phone: String(shipping.phone || ""),
          address: String(shipping.address || ""),
          city: String(shipping.city || ""),
          state: String(shipping.state || ""),
          pincode: String(shipping.pincode || ""),
          gstin: typeof shipping.gstin === "string" ? shipping.gstin : undefined,
        },
        shipping: {
          fullName: String(shipping.fullName || "Recipient"),
          address: String(shipping.address || ""),
          city: String(shipping.city || ""),
          state: String(shipping.state || ""),
          pincode: String(shipping.pincode || ""),
          phone: String(shipping.phone || ""),
        },
        lines: Array.isArray(snap?.lines)
          ? (snap.lines as Array<Record<string, unknown>>)
          : Array.isArray(ord.lines)
          ? (ord.lines as Array<Record<string, unknown>>).map((l, i) => ({
              productId: String(l.productId || `item-${i}`),
              name: String(l.name || l.productId || "Product"),
              sku: String(l.sku || l.productId || ""),
              hsnCode: "3304",
              quantity: Number(l.quantity || 1),
              unitPrice: Number(l.unitPrice || 0),
              discount: 0,
              taxableValue: Number(l.unitPrice || 0) * Number(l.quantity || 1),
              gstRate: 18,
              cgst: isIntra ? (Number(l.unitPrice || 0) * Number(l.quantity || 1) * 0.09) : 0,
              sgst: isIntra ? (Number(l.unitPrice || 0) * Number(l.quantity || 1) * 0.09) : 0,
              igst: !isIntra ? (Number(l.unitPrice || 0) * Number(l.quantity || 1) * 0.18) : 0,
              gstTotal: Number(l.unitPrice || 0) * Number(l.quantity || 1) * 0.18,
              lineTotal: Number(l.unitPrice || 0) * Number(l.quantity || 1) * 1.18,
            }))
          : [],
        subtotal: Number(snap?.subtotal || ord.subtotal || ord.total),
        discount: Number(snap?.totalDiscount || ord.discount || 0),
        taxableValue: Number(snap?.taxableProductValue || ord.subtotal || ord.total),
        totalCgst: Number(snap?.totalCgst || 0),
        totalSgst: Number(snap?.totalSgst || 0),
        totalIgst: Number(snap?.totalIgst || 0),
        totalGst: Number(snap?.totalGst || 0),
        shippingCharge: Number(snap?.shippingCharge || ord.shippingFee || 0),
        shippingTax: Number(snap?.shippingTax || 0),
        codFee: Number(snap?.codFee || 0),
        otherCharges: Array.isArray(snap?.otherCharges) ? snap.otherCharges : [],
        totalOtherCharges: Number(snap?.totalOtherCharges || 0),
        donationAmount: Number(snap?.donationAmount || (ord as Record<string, unknown>).donationAmount || 0),
        donationTax: Number(snap?.donationTax || 0),
        roundOff: Number(snap?.roundOff || 0),
        grandTotal: Number(snap?.grandTotal || ord.total),
        amountPaid: ord.paymentStatus === "paid" ? Number(ord.total) : 0,
        amountDue: ord.paymentStatus === "paid" ? 0 : Number(ord.total),
        paymentMethod: String(ord.paymentMethod || "COD"),
        paymentStatus: String(ord.paymentStatus || "Paid"),
        gstBreakdown: Array.isArray(snap?.gstBreakdown) ? snap.gstBreakdown : [],
        amountInWords: typeof snap?.amountInWords === "string" ? snap.amountInWords : amountInWords(Number(ord.total)),
      };
    }

    // Default: use rich sample order
    const s = sampleOrderData as Record<string, unknown> | null;
    return {
      invoiceNo: String(s?.invoiceNo || "QC-INV-2026-27/01042"),
      invoiceDate: String(s?.invoiceDate || new Date().toISOString()),
      orderNo: String(s?.orderNo || "QC-ORD-89421"),
      placeOfSupply: String(s?.placeOfSupply || "Maharashtra"),
      isIntraState: Boolean(s?.isIntraState ?? true),
      customer: (s?.customer as Record<string, string>) || {
        name: "Dr. Aanya Deshmukh",
        email: "aanya.deshmukh@example.com",
        phone: "+91 98201 54321",
        address: "Flat 402, Sea Green Apartments, Worli Sea Face",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400018",
        gstin: "27AAACD1234F1Z2",
      },
      shipping: (s?.shipping as Record<string, string>) || {
        fullName: "Dr. Aanya Deshmukh",
        address: "Flat 402, Sea Green Apartments, Worli Sea Face",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400018",
        phone: "+91 98201 54321",
      },
      lines: (s?.lines as Array<Record<string, unknown>>) || [],
      subtotal: Number(s?.subtotal || 6750),
      discount: Number(s?.discount || 400),
      taxableValue: Number(s?.taxableValue || 6350),
      totalCgst: Number(s?.totalCgst || 571.5),
      totalSgst: Number(s?.totalSgst || 571.5),
      totalIgst: Number(s?.totalIgst || 0),
      totalGst: Number(s?.totalGst || 1143),
      shippingCharge: Number(s?.shippingCharge || 0),
      shippingTax: Number(s?.shippingTax || 0),
      codFee: Number(s?.codFee || 0),
      otherCharges: (s?.otherCharges as Array<Record<string, unknown>>) || [],
      totalOtherCharges: Number(s?.totalOtherCharges || 0),
      donationAmount: Number(s?.donationAmount || 50),
      donationTax: Number(s?.donationTax || 0),
      roundOff: Number(s?.roundOff || 0.5),
      grandTotal: Number(s?.grandTotal || 7543),
      amountPaid: Number(s?.amountPaid || 7543),
      amountDue: Number(s?.amountDue || 0),
      paymentMethod: String(s?.paymentMethod || "UPI (Prepaid)"),
      paymentStatus: String(s?.paymentStatus || "paid"),
      gstBreakdown: (s?.gstBreakdown as Array<Record<string, unknown>>) || [],
      amountInWords: String(s?.amountInWords || "Indian Rupees Seven Thousand Five Hundred Forty-Three Only"),
    };
  }, [selectedOrderId, realOrderData, sampleOrderData, businessInfo]);

  // Download Sample PDF from live state
  const handleDownloadSamplePdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const payload = {
        action: "preview-pdf",
        pdfData: {
          ...previewData,
          businessInfo,
          invoiceConfig,
          columnsConfig,
          templateConfig,
        },
      };
      const res = await fetch("/api/admin/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `QueensCare-Invoice-${previewData.invoiceNo.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      alert("Failed to download PDF preview.");
    }
    setIsDownloadingPdf(false);
  };

  if (loading) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)" }}>
        <p>Loading Queens Care Invoice Designer…</p>
      </div>
    );
  }

  const primaryCol = templateConfig.primaryColor || "#2A0F3A";
  const accentCol = templateConfig.accentColor || "#C19A6B";
  const fontFamilyStyle =
    templateConfig.fontFamily === "serif"
      ? "Georgia, 'Times New Roman', serif"
      : templateConfig.fontFamily === "mono"
      ? "'Courier New', Courier, monospace"
      : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ─── DESIGNER HEADER & ACTION BAR ─── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--line, #e6e4ea)",
          borderRadius: 8,
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>📄</span>
            <div>
              <h2 style={{ margin: 0, font: "20px var(--font-display, serif)", color: primaryCol }}>
                Invoice & Tax Designer
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted, #666)" }}>
                Configure Queens Care GST invoices, brand lockup, visible columns, and tax calculations with live A4 preview.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => handleReset()}
            style={{
              padding: "8px 14px",
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 4,
              fontSize: 12,
              cursor: "pointer",
              color: "#555",
            }}
          >
            🔄 Reset
          </button>

          <button
            onClick={() => window.print()}
            style={{
              padding: "8px 14px",
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 4,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>🖨️</span> Print View
          </button>

          <button
            onClick={handleDownloadSamplePdf}
            disabled={isDownloadingPdf}
            style={{
              padding: "8px 16px",
              background: "#f3eef8",
              border: `1px solid ${primaryCol}`,
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: isDownloadingPdf ? "wait" : "pointer",
              color: primaryCol,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>📥</span> {isDownloadingPdf ? "Generating PDF…" : "Download PDF"}
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            style={{
              padding: "8px 14px",
              background: "#fff",
              border: "1px solid var(--line, #ccc)",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: saving ? "wait" : "pointer",
              color: "#333",
            }}
          >
            Save Draft
          </button>

          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            style={{
              padding: "9px 20px",
              background: primaryCol,
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              cursor: saving ? "wait" : "pointer",
              boxShadow: "0 2px 6px rgba(42,15,58,0.25)",
            }}
          >
            {saving ? "Publishing…" : "💾 Save & Publish"}
          </button>
        </div>
      </div>

      {/* Status Notice */}
      {notice && (
        <div
          style={{
            padding: "10px 16px",
            background: notice.error ? "#ffebee" : "#e8f5e9",
            color: notice.error ? "#c62828" : "#2e7d32",
            border: `1px solid ${notice.error ? "#ffcdd2" : "#c8e6c9"}`,
            borderRadius: 6,
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{notice.text}</span>
          <button
            onClick={() => setNotice(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── SPLIT VIEW CONTAINER (LEFT CONTROLS, RIGHT PREVIEW) ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(340px, 440px) 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* ══ LEFT: CONFIGURATION CONTROLS ══ */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--line, #e6e4ea)",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          {/* Tabs navigation */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              borderBottom: "1px solid var(--line, #e6e4ea)",
              background: "#faf9fc",
            }}
          >
            {[
              { id: "brand", label: "🏢 Brand" },
              { id: "numbering", label: "📄 Numbering" },
              { id: "columns", label: "📊 Columns" },
              { id: "tax", label: "⚖️ Tax / GST" },
              { id: "charges", label: "🚚 Charges" },
              { id: "donation", label: "❤️ Donation" },
              { id: "styling", label: "🎨 Styling" },
              { id: "terms", label: "📜 Terms" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as ActiveTab)}
                style={{
                  padding: "10px 4px",
                  fontSize: 11,
                  fontWeight: activeTab === t.id ? 700 : 500,
                  color: activeTab === t.id ? primaryCol : "var(--muted, #666)",
                  borderBottom: activeTab === t.id ? `2px solid ${primaryCol}` : "none",
                  borderRight: "1px solid #f0edf4",
                  background: activeTab === t.id ? "#fff" : "transparent",
                  cursor: "pointer",
                  borderTop: "none",
                  borderLeft: "none",
                  textAlign: "center",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div style={{ padding: "20px 22px", maxHeight: "calc(100vh - 240px)", overflowY: "auto" }}>
            {/* 1. BRAND & COMPANY */}
            {activeTab === "brand" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h4 style={{ margin: "0 0 6px", font: "15px var(--font-display)", color: primaryCol }}>
                  Brand & Registered Business Information
                </h4>

                {/* Logo selection */}
                <div>
                  <label style={labelStyle}>Company Logo</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <select
                      value={businessInfo.logoUrl}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, logoUrl: e.target.value })}
                      style={selectStyle}
                    >
                      <option value="/images/brand/queens-care-horizontal-purple.png">Horizontal Purple Logo (Recommended)</option>
                      <option value="/images/brand/queens-care-logo-original.png">Original Crest + Text Logo</option>
                      <option value="/images/brand/queens-care-gold-logo.png">Luxury Gold Logo</option>
                      <option value="/images/brand/queens-care-crest.png">Royal Crest Icon Only</option>
                      {availableLogos.map((l) => (
                        <option key={l.url} value={l.url}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "#faf8fc", border: "1px solid #e6e4ea", borderRadius: 4 }}>
                    <img src={businessInfo.logoUrl} alt="Logo Preview" style={{ height: 28, maxWidth: 140, objectFit: "contain" }} />
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>Active invoice header logo</span>
                  </div>
                </div>

                {/* Logo Height & Alignment */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Logo Height: {businessInfo.logoHeight || 46}px</label>
                    <input
                      type="range"
                      min={28}
                      max={64}
                      value={businessInfo.logoHeight || 46}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, logoHeight: Number(e.target.value) })}
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Logo Alignment</label>
                    <select
                      value={businessInfo.logoAlignment || "left"}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, logoAlignment: e.target.value as "left" | "center" | "right" })}
                      style={selectStyle}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Legal Company Name</label>
                  <input
                    value={businessInfo.legalName}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, legalName: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Trade / Display Name</label>
                  <input
                    value={businessInfo.tradeName}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, tradeName: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Tagline</label>
                  <input
                    value={businessInfo.tagline}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, tagline: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                {/* GSTIN, PAN, CIN */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>GSTIN</label>
                    <input
                      value={businessInfo.gstin}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, gstin: e.target.value.toUpperCase() })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>PAN</label>
                    <input
                      value={businessInfo.pan}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, pan: e.target.value.toUpperCase() })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>CIN (Corporate Identification Number)</label>
                  <input
                    value={businessInfo.cin || ""}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, cin: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Registered Business Address</label>
                  <textarea
                    rows={2}
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input
                      value={businessInfo.city}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>State</label>
                    <input
                      value={businessInfo.state}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, state: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Pincode</label>
                    <input
                      value={businessInfo.pincode}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, pincode: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Official Email</label>
                    <input
                      value={businessInfo.email}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Official Phone</label>
                    <input
                      value={businessInfo.phone}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Website URL</label>
                  <input
                    value={businessInfo.website}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* 2. INVOICE NUMBERING & METADATA */}
            {activeTab === "numbering" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h4 style={{ margin: "0 0 6px", font: "15px var(--font-display)", color: primaryCol }}>
                  Invoice Titles & Numbering Sequence
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Document Title</label>
                    <input
                      value={invoiceConfig.title}
                      onChange={(e) => setInvoiceConfig({ ...invoiceConfig, title: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Document Subtitle</label>
                    <input
                      value={invoiceConfig.subtitle}
                      onChange={(e) => setInvoiceConfig({ ...invoiceConfig, subtitle: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Invoice Prefix</label>
                    <input
                      value={invoiceConfig.prefix}
                      onChange={(e) => setInvoiceConfig({ ...invoiceConfig, prefix: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Next Invoice Number</label>
                    <input
                      type="number"
                      value={invoiceConfig.nextNumber}
                      onChange={(e) => setInvoiceConfig({ ...invoiceConfig, nextNumber: Number(e.target.value) })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Numbering Format Template</label>
                  <input
                    value={invoiceConfig.format}
                    onChange={(e) => setInvoiceConfig({ ...invoiceConfig, format: e.target.value })}
                    style={inputStyle}
                  />
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>
                    Supported tokens: {"{year}"}, {"{nextYear}"}, {"{number:5}"}
                  </span>
                </div>

                <div>
                  <label style={labelStyle}>Date Format</label>
                  <select
                    value={invoiceConfig.dateFormat || "DD/MM/YYYY"}
                    onChange={(e) => setInvoiceConfig({ ...invoiceConfig, dateFormat: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 14/09/2026)</option>
                    <option value="DD MMM YYYY">DD MMM YYYY (e.g. 14 Sep 2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-14)</option>
                  </select>
                </div>

                <h5 style={{ margin: "10px 0 4px", fontSize: 12, fontWeight: 700, color: "#333" }}>
                  Metadata Visibility Toggles
                </h5>

                {[
                  { key: "showInvoiceDate", label: "Show Invoice Date" },
                  { key: "showOrderNumber", label: "Show Order Number" },
                  { key: "showPaymentStatus", label: "Show Payment Status" },
                  { key: "showPaymentMethod", label: "Show Payment Method" },
                  { key: "showPlaceOfSupply", label: "Show Place of Supply & State Code" },
                  { key: "showReverseCharge", label: "Show Reverse Charge Indicator" },
                ].map((toggle) => (
                  <label key={toggle.key} style={toggleRowStyle}>
                    <input
                      type="checkbox"
                      checked={Boolean(invoiceConfig[toggle.key as keyof InvoiceConfig])}
                      onChange={(e) =>
                        setInvoiceConfig({
                          ...invoiceConfig,
                          [toggle.key]: e.target.checked,
                        })
                      }
                    />
                    <span style={{ fontSize: 12 }}>{toggle.label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* 3. PRODUCT TABLE COLUMNS */}
            {activeTab === "columns" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h4 style={{ margin: "0 0 4px", font: "15px var(--font-display)", color: primaryCol }}>
                  Configurable Items Table Columns
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                  Choose which columns appear on customer and accounting invoices.
                </p>

                {[
                  { key: "showProductImage", label: "Product Thumbnail Image" },
                  { key: "showSku", label: "Product SKU / Code" },
                  { key: "showHsn", label: "HSN / SAC Code (Required for GST)" },
                  { key: "showQuantity", label: "Quantity" },
                  { key: "showUnitPrice", label: "Unit Rate / Price" },
                  { key: "showDiscount", label: "Item Discount" },
                  { key: "showTaxableValue", label: "Taxable Value" },
                  { key: "showGstRate", label: "GST Rate %" },
                  { key: "showCgst", label: "CGST (for intra-state)" },
                  { key: "showSgst", label: "SGST (for intra-state)" },
                  { key: "showIgst", label: "IGST (for inter-state)" },
                  { key: "showLineTotal", label: "Line Total" },
                ].map((col) => (
                  <label key={col.key} style={toggleRowStyle}>
                    <input
                      type="checkbox"
                      checked={Boolean(columnsConfig[col.key as keyof InvoiceColumnsConfig])}
                      onChange={(e) =>
                        setColumnsConfig({
                          ...columnsConfig,
                          [col.key]: e.target.checked,
                        })
                      }
                    />
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{col.label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* 4. GST & TAX */}
            {activeTab === "tax" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h4 style={{ margin: "0 0 6px", font: "15px var(--font-display)", color: primaryCol }}>
                  GST & Tax Calculation Engine
                </h4>

                <label style={toggleRowStyle}>
                  <input
                    type="checkbox"
                    checked={taxConfig.enabled}
                    onChange={(e) => setTaxConfig({ ...taxConfig, enabled: e.target.checked })}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Enable Indian Goods & Services Tax (GST)</span>
                </label>

                <div>
                  <label style={labelStyle}>Default GST Rate (%)</label>
                  <input
                    type="number"
                    value={taxConfig.defaultRate}
                    onChange={(e) => setTaxConfig({ ...taxConfig, defaultRate: Number(e.target.value) })}
                    style={inputStyle}
                  />
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    {[0, 5, 12, 18, 28].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setTaxConfig({ ...taxConfig, defaultRate: rate })}
                        style={{
                          padding: "4px 8px",
                          fontSize: 11,
                          border: "1px solid #ccc",
                          borderRadius: 3,
                          background: taxConfig.defaultRate === rate ? primaryCol : "#fff",
                          color: taxConfig.defaultRate === rate ? "#fff" : "#333",
                          cursor: "pointer",
                        }}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Pricing Display Mode</label>
                  <select
                    value={taxConfig.taxInclusive ? "inclusive" : "exclusive"}
                    onChange={(e) => setTaxConfig({ ...taxConfig, taxInclusive: e.target.value === "inclusive" })}
                    style={selectStyle}
                  >
                    <option value="exclusive">Tax-Exclusive (Tax added on top at checkout & invoice)</option>
                    <option value="inclusive">Tax-Inclusive (Prices already include tax)</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Rounding Method</label>
                  <select
                    value={taxConfig.rounding || "nearest"}
                    onChange={(e) => setTaxConfig({ ...taxConfig, rounding: e.target.value as "nearest" | "up" | "down" })}
                    style={selectStyle}
                  >
                    <option value="nearest">Nearest Rupee (Standard commercial)</option>
                    <option value="up">Round Up (Ceiling)</option>
                    <option value="down">Round Down (Floor)</option>
                  </select>
                </div>

                <div style={{ padding: "12px 14px", background: "#fbfaf8", border: "1px solid #eee", borderRadius: 4, fontSize: 11.5, color: "#555" }}>
                  ℹ️ <b>GST Rule:</b> Intra-state transactions (delivery inside {businessInfo.state}) split tax equally into <b>CGST ({taxConfig.defaultRate / 2}%)</b> and <b>SGST ({taxConfig.defaultRate / 2}%)</b>. Inter-state transactions automatically calculate <b>IGST ({taxConfig.defaultRate}%)</b>.
                </div>
              </div>
            )}

            {/* 5. CHARGES */}
            {activeTab === "charges" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h4 style={{ margin: "0 0 6px", font: "15px var(--font-display)", color: primaryCol }}>
                  Shipping, COD & Surcharges
                </h4>

                {otherCharges.map((chg, idx) => (
                  <div key={chg.id} style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 6, background: "#faf8fc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>{chg.name}</label>
                      <button
                        type="button"
                        onClick={() => setOtherCharges(otherCharges.filter((_, i) => i !== idx))}
                        style={{ color: "#c62828", background: "none", border: "none", cursor: "pointer", fontSize: 11 }}
                      >
                        Delete
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <input
                        placeholder="Charge Name"
                        value={chg.name}
                        onChange={(e) => {
                          const copy = [...otherCharges];
                          copy[idx].name = e.target.value;
                          setOtherCharges(copy);
                        }}
                        style={inputStyle}
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={chg.amount}
                        onChange={(e) => {
                          const copy = [...otherCharges];
                          copy[idx].amount = Number(e.target.value);
                          setOtherCharges(copy);
                        }}
                        style={inputStyle}
                      />
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 11 }}>
                      <input
                        type="checkbox"
                        checked={chg.enabled}
                        onChange={(e) => {
                          const copy = [...otherCharges];
                          copy[idx].enabled = e.target.checked;
                          setOtherCharges(copy);
                        }}
                      />
                      Active on Invoices
                    </label>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setOtherCharges([
                      ...otherCharges,
                      {
                        id: `charge-${Date.now().toString(36)}`,
                        name: "Packaging & Handling",
                        description: "Eco-friendly pharmaceutical packaging",
                        amount: 49,
                        type: "fixed",
                        enabled: true,
                        taxTreatment: "taxable",
                        gstRate: 18,
                        automaticallyApplied: false,
                        sortOrder: otherCharges.length,
                      },
                    ])
                  }
                  style={{
                    padding: "8px 14px",
                    background: "#fff",
                    border: `1px dashed ${primaryCol}`,
                    color: primaryCol,
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  + Add Custom Charge
                </button>
              </div>
            )}

            {/* 6. DONATION */}
            {activeTab === "donation" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h4 style={{ margin: "0 0 6px", font: "15px var(--font-display)", color: primaryCol }}>
                  Charity & Foundation Donation Settings
                </h4>

                <label style={toggleRowStyle}>
                  <input
                    type="checkbox"
                    checked={donationConfig.enabled}
                    onChange={(e) => setDonationConfig({ ...donationConfig, enabled: e.target.checked })}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Enable Donation Checkout Contribution</span>
                </label>

                <div>
                  <label style={labelStyle}>Donation Invoice Label</label>
                  <input
                    value={donationConfig.label}
                    onChange={(e) => setDonationConfig({ ...donationConfig, label: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Foundation / Cause Name</label>
                  <input
                    value={donationConfig.causeName}
                    onChange={(e) => setDonationConfig({ ...donationConfig, causeName: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Preset Amounts (comma separated)</label>
                    <input
                      value={donationConfig.presetAmounts.join(", ")}
                      onChange={(e) =>
                        setDonationConfig({
                          ...donationConfig,
                          presetAmounts: e.target.value
                            .split(",")
                            .map((s) => Number(s.trim()))
                            .filter((n) => !isNaN(n) && n > 0),
                        })
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Tax Treatment</label>
                    <select
                      value={donationConfig.taxTreatment}
                      onChange={(e) =>
                        setDonationConfig({
                          ...donationConfig,
                          taxTreatment: e.target.value as "taxable" | "non_taxable",
                        })
                      }
                      style={selectStyle}
                    >
                      <option value="non_taxable">Non-Taxable (Section 80G Exempt)</option>
                      <option value="taxable">Taxable</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 7. TEMPLATE & STYLING */}
            {activeTab === "styling" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h4 style={{ margin: "0 0 6px", font: "15px var(--font-display)", color: primaryCol }}>
                  Template Layout, Colors & Typography
                </h4>

                <div>
                  <label style={labelStyle}>Template Preset</label>
                  <select
                    value={templateConfig.templateStyle || "default_premium"}
                    onChange={(e) =>
                      setTemplateConfig({
                        ...templateConfig,
                        templateStyle: e.target.value as "default_premium" | "detailed_gst" | "compact",
                      })
                    }
                    style={selectStyle}
                  >
                    <option value="default_premium">Queens Care Luxury Default</option>
                    <option value="detailed_gst">Detailed Indian GST Compliance</option>
                    <option value="compact">Compact Single-Page Layout</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Primary Accent Color</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="color"
                        value={templateConfig.primaryColor || "#2A0F3A"}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, primaryColor: e.target.value })}
                        style={{ width: 36, height: 32, border: "none", cursor: "pointer" }}
                      />
                      <input
                        value={templateConfig.primaryColor || "#2A0F3A"}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, primaryColor: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Gold / Secondary Accent</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="color"
                        value={templateConfig.accentColor || "#C19A6B"}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, accentColor: e.target.value })}
                        style={{ width: 36, height: 32, border: "none", cursor: "pointer" }}
                      />
                      <input
                        value={templateConfig.accentColor || "#C19A6B"}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, accentColor: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Font Family</label>
                  <select
                    value={templateConfig.fontFamily || "system"}
                    onChange={(e) =>
                      setTemplateConfig({
                        ...templateConfig,
                        fontFamily: e.target.value as "system" | "serif" | "mono" | "sans",
                      })
                    }
                    style={selectStyle}
                  >
                    <option value="system">Modern Corporate Sans-Serif</option>
                    <option value="serif">Luxury Editorial Serif (Georgia)</option>
                    <option value="mono">Clinical Monospace</option>
                  </select>
                </div>

                <h5 style={{ margin: "10px 0 4px", fontSize: 12, fontWeight: 700, color: "#333" }}>
                  Visible Document Sections
                </h5>

                {[
                  { key: "showAmountInWords", label: "Amount in Words (INR Words)" },
                  { key: "showGstBreakupTable", label: "HSN/SAC GST Summary Table" },
                  { key: "showTerms", label: "Terms & Conditions Block" },
                  { key: "showSignature", label: "Authorized Signatory Stamp & Box" },
                ].map((s) => (
                  <label key={s.key} style={toggleRowStyle}>
                    <input
                      type="checkbox"
                      checked={Boolean(templateConfig[s.key as keyof InvoiceTemplateConfig])}
                      onChange={(e) =>
                        setTemplateConfig({
                          ...templateConfig,
                          [s.key]: e.target.checked,
                        })
                      }
                    />
                    <span style={{ fontSize: 12 }}>{s.label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* 8. TERMS & SIGNATORY */}
            {activeTab === "terms" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h4 style={{ margin: "0 0 6px", font: "15px var(--font-display)", color: primaryCol }}>
                  Legal Terms, Return Policy & Signatory
                </h4>

                <div>
                  <label style={labelStyle}>Terms & Conditions</label>
                  <textarea
                    rows={4}
                    value={businessInfo.termsAndConditions}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, termsAndConditions: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Returns / Refund Policy Note</label>
                  <textarea
                    rows={2}
                    value={businessInfo.returnsPolicy}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, returnsPolicy: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Signatory Entity Title</label>
                    <input
                      value={businessInfo.signatoryTitle}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, signatoryTitle: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Signatory Position Label</label>
                    <input
                      value={businessInfo.authorizedSignatoryLabel}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, authorizedSignatoryLabel: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Invoice Footer Note</label>
                  <input
                    value={businessInfo.invoiceFooter}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, invoiceFooter: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT: LIVE REACTIVE A4 INVOICE PREVIEW ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Preview Toolbar */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line, #e6e4ea)",
              borderRadius: 6,
              padding: "10px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {/* Order Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#444" }}>Previewing with:</span>
              <select
                value={selectedOrderId}
                onChange={(e) => handleSelectOrder(e.target.value)}
                style={{ ...selectStyle, width: "auto", minWidth: 220 }}
              >
                <option value="sample">Sample Order (Dr. Aanya Deshmukh - ₹7,543)</option>
                {recentOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    Order #{o.id} ({o.customerName} - ₹{o.total})
                  </option>
                ))}
              </select>
            </div>

            {/* Scale controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>Zoom:</span>
              {[
                { label: "Fit", val: 0.85 },
                { label: "100%", val: 1 },
                { label: "120%", val: 1.2 },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => setZoomScale(s.val)}
                  style={{
                    padding: "3px 8px",
                    fontSize: 11,
                    border: "1px solid #ccc",
                    borderRadius: 3,
                    background: zoomScale === s.val ? primaryCol : "#fff",
                    color: zoomScale === s.val ? "#fff" : "#333",
                    cursor: "pointer",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* A4 Sheet Container */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              overflowX: "auto",
              padding: "10px 0",
            }}
          >
            <div
              ref={previewRef}
              style={{
                width: 794, // Standard 96 DPI A4 width
                minHeight: 1123, // Standard 96 DPI A4 height
                background: "#ffffff",
                boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                padding: "36px 42px",
                boxSizing: "border-box",
                fontFamily: fontFamilyStyle,
                color: "#1C1424",
                transform: `scale(${zoomScale})`,
                transformOrigin: "top center",
                transition: "transform 0.15s ease",
              }}
            >
              {/* Top Accent Ribbon */}
              <div style={{ height: 4, background: primaryCol, marginBottom: 16 }} />

              {/* Header: Logo & Company (Left) + TAX INVOICE (Right) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ maxWidth: 440 }}>
                  <img
                    src={businessInfo.logoUrl}
                    alt={businessInfo.tradeName}
                    style={{
                      height: businessInfo.logoHeight || 46,
                      maxWidth: 240,
                      objectFit: "contain",
                      display: "block",
                      marginBottom: 8,
                    }}
                  />
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: primaryCol }}>
                    {businessInfo.legalName}
                  </h3>
                  {businessInfo.tagline && (
                    <p style={{ margin: "2px 0 4px", fontSize: 10.5, fontStyle: "italic", color: accentCol }}>
                      {businessInfo.tagline}
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: 9.5, color: "#555", lineHeight: 1.45 }}>
                    {businessInfo.address}, {businessInfo.city}, {businessInfo.state} - {businessInfo.pincode}, {businessInfo.country}
                    <br />
                    Phone: {businessInfo.phone} · Email: {businessInfo.email} · Web: {businessInfo.website}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 10, fontWeight: 600 }}>
                    {businessInfo.gstin && `GSTIN: ${businessInfo.gstin}   `}
                    {businessInfo.pan && `PAN: ${businessInfo.pan}   `}
                    {businessInfo.cin && `CIN: ${businessInfo.cin}`}
                  </p>
                </div>

                {/* Right Side: Tax Invoice Badge & Numbering */}
                <div style={{ textAlign: "right", minWidth: 230 }}>
                  <div
                    style={{
                      background: primaryCol,
                      color: "#fff",
                      padding: "5px 12px",
                      borderRadius: 3,
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textAlign: "center",
                      marginBottom: 4,
                    }}
                  >
                    {invoiceConfig.title || "TAX INVOICE"}
                  </div>
                  <div style={{ fontSize: 9.5, color: "var(--muted)", textAlign: "center", marginBottom: 10 }}>
                    {invoiceConfig.subtitle || "Original for Recipient"}
                  </div>

                  <div
                    style={{
                      background: "#fbf9fc",
                      border: "1px solid #e5e0eb",
                      borderRadius: 4,
                      padding: "8px 12px",
                      fontSize: 10.5,
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "#666" }}>Invoice No:</span>
                      <b style={{ color: primaryCol }}>{previewData.invoiceNo}</b>
                    </div>
                    {invoiceConfig.showInvoiceDate !== false && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#666" }}>Date:</span>
                        <span>{new Date(previewData.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      </div>
                    )}
                    {invoiceConfig.showOrderNumber !== false && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#666" }}>Order No:</span>
                        <span>{previewData.orderNo}</span>
                      </div>
                    )}
                    {invoiceConfig.showPlaceOfSupply !== false && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#666" }}>Place of Supply:</span>
                        <span>{previewData.placeOfSupply}</span>
                      </div>
                    )}
                    {invoiceConfig.showReverseCharge !== false && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#666" }}>Reverse Charge:</span>
                        <span>No</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bill To & Ship To Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                {/* Bill To */}
                <div style={{ border: "1px solid #e5e0eb", borderRadius: 4, overflow: "hidden", background: "#fcfbfe" }}>
                  <div style={{ background: primaryCol, color: "#fff", padding: "4px 10px", fontSize: 10, fontWeight: 700, letterSpacing: ".06em" }}>
                    BILL TO (BUYER DETAILS)
                  </div>
                  <div style={{ padding: "8px 12px", fontSize: 10.5, lineHeight: 1.45 }}>
                    <b>{previewData.customer.name}</b>
                    <div style={{ color: "#555" }}>
                      {previewData.customer.address || "Address as per order record"}<br />
                      {previewData.customer.city && `${previewData.customer.city}, `}
                      {previewData.customer.state} {previewData.customer.pincode}
                    </div>
                    <div style={{ color: "#666", fontSize: 10, marginTop: 4 }}>
                      Phone: {previewData.customer.phone || "—"} · Email: {previewData.customer.email || "—"}
                    </div>
                    {previewData.customer.gstin && (
                      <div style={{ fontWeight: 600, marginTop: 4, color: primaryCol }}>
                        Buyer GSTIN: {previewData.customer.gstin}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ship To */}
                <div style={{ border: "1px solid #e5e0eb", borderRadius: 4, overflow: "hidden", background: "#fcfbfe" }}>
                  <div style={{ background: primaryCol, color: "#fff", padding: "4px 10px", fontSize: 10, fontWeight: 700, letterSpacing: ".06em" }}>
                    SHIP TO (DISPATCH DESTINATION)
                  </div>
                  <div style={{ padding: "8px 12px", fontSize: 10.5, lineHeight: 1.45 }}>
                    <b>{previewData.shipping.fullName || previewData.customer.name}</b>
                    <div style={{ color: "#555" }}>
                      {previewData.shipping.address}<br />
                      {previewData.shipping.city}, {previewData.shipping.state} - {previewData.shipping.pincode}
                    </div>
                    <div style={{ color: "#666", fontSize: 10, marginTop: 4 }}>
                      Phone: {previewData.shipping.phone || previewData.customer.phone || "—"} · State: {previewData.shipping.state}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: primaryCol, color: "#ffffff", textAlign: "left" }}>
                    <th style={{ padding: "6px 8px", width: 24, textAlign: "center" }}>#</th>
                    <th style={{ padding: "6px 8px" }}>Product Description</th>
                    {columnsConfig.showHsn && <th style={{ padding: "6px 8px", textAlign: "center" }}>HSN/SAC</th>}
                    {columnsConfig.showQuantity && <th style={{ padding: "6px 8px", textAlign: "center" }}>Qty</th>}
                    {columnsConfig.showUnitPrice && <th style={{ padding: "6px 8px", textAlign: "right" }}>Rate</th>}
                    {columnsConfig.showDiscount && <th style={{ padding: "6px 8px", textAlign: "right" }}>Disc</th>}
                    {columnsConfig.showTaxableValue && <th style={{ padding: "6px 8px", textAlign: "right" }}>Taxable</th>}
                    {columnsConfig.showGstRate && <th style={{ padding: "6px 8px", textAlign: "right" }}>GST %</th>}
                    {previewData.isIntraState ? (
                      <>
                        {columnsConfig.showCgst && <th style={{ padding: "6px 8px", textAlign: "right" }}>CGST</th>}
                        {columnsConfig.showSgst && <th style={{ padding: "6px 8px", textAlign: "right" }}>SGST</th>}
                      </>
                    ) : (
                      columnsConfig.showIgst && <th style={{ padding: "6px 8px", textAlign: "right" }}>IGST</th>
                    )}
                    {columnsConfig.showLineTotal && <th style={{ padding: "6px 8px", textAlign: "right" }}>Total</th>}
                  </tr>
                </thead>
                <tbody>
                  {previewData.lines.map((l, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #ebe7f0", background: i % 2 === 1 ? "#faf9fc" : "#fff" }}>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>{i + 1}</td>
                      <td style={{ padding: "6px 8px" }}>
                        <b>{String(l.name)}</b>
                        {columnsConfig.showSku && Boolean(l.sku) && (
                          <div style={{ fontSize: 9.5, color: "#777" }}>SKU: {String(l.sku)}</div>
                        )}
                      </td>
                      {columnsConfig.showHsn && <td style={{ padding: "6px 8px", textAlign: "center" }}>{String(l.hsnCode || "3304")}</td>}
                      {columnsConfig.showQuantity && <td style={{ padding: "6px 8px", textAlign: "center" }}>{Number(l.quantity)}</td>}
                      {columnsConfig.showUnitPrice && <td style={{ padding: "6px 8px", textAlign: "right" }}>₹{Number(l.unitPrice || 0).toFixed(0)}</td>}
                      {columnsConfig.showDiscount && <td style={{ padding: "6px 8px", textAlign: "right", color: l.discount ? "#2e7d32" : "inherit" }}>{l.discount ? `-₹${Number(l.discount).toFixed(0)}` : "—"}</td>}
                      {columnsConfig.showTaxableValue && <td style={{ padding: "6px 8px", textAlign: "right" }}>₹{Number(l.taxableValue || 0).toFixed(0)}</td>}
                      {columnsConfig.showGstRate && <td style={{ padding: "6px 8px", textAlign: "right" }}>{Number(l.gstRate || 18)}%</td>}
                      {previewData.isIntraState ? (
                        <>
                          {columnsConfig.showCgst && <td style={{ padding: "6px 8px", textAlign: "right" }}>{l.cgst ? `₹${Number(l.cgst).toFixed(0)}` : "—"}</td>}
                          {columnsConfig.showSgst && <td style={{ padding: "6px 8px", textAlign: "right" }}>{l.sgst ? `₹${Number(l.sgst).toFixed(0)}` : "—"}</td>}
                        </>
                      ) : (
                        columnsConfig.showIgst && <td style={{ padding: "6px 8px", textAlign: "right" }}>{l.igst ? `₹${Number(l.igst).toFixed(0)}` : "—"}</td>
                      )}
                      {columnsConfig.showLineTotal && <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700 }}>₹{Number(l.lineTotal || 0).toFixed(0)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals & Notes Section */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, marginBottom: 20 }}>
                {/* Left Side: Amount In Words & HSN GST Summary */}
                <div style={{ flex: 1 }}>
                  {templateConfig.showAmountInWords !== false && (
                    <div style={{ padding: "8px 12px", background: "#fcfbfe", border: "1px solid #e5e0eb", borderRadius: 4, marginBottom: 14 }}>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: primaryCol, textTransform: "uppercase" }}>Amount in Words:</div>
                      <div style={{ fontSize: 10.5, fontStyle: "italic", marginTop: 2 }}>{previewData.amountInWords}</div>
                    </div>
                  )}

                  {/* GST Summary Table */}
                  {templateConfig.showGstBreakupTable !== false && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: primaryCol, marginBottom: 4, textTransform: "uppercase" }}>
                        Tax Summary (HSN/SAC Breakdown)
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5, border: "1px solid #e5e0eb" }}>
                        <thead>
                          <tr style={{ background: "#ede9f3", color: primaryCol }}>
                            <th style={{ padding: "4px 6px", textAlign: "center" }}>HSN/SAC</th>
                            <th style={{ padding: "4px 6px", textAlign: "right" }}>Taxable</th>
                            {previewData.isIntraState ? (
                              <>
                                <th style={{ padding: "4px 6px", textAlign: "right" }}>CGST</th>
                                <th style={{ padding: "4px 6px", textAlign: "right" }}>SGST</th>
                              </>
                            ) : (
                              <th style={{ padding: "4px 6px", textAlign: "right" }}>IGST</th>
                            )}
                            <th style={{ padding: "4px 6px", textAlign: "right" }}>Total Tax</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "4px 6px", textAlign: "center" }}>3304</td>
                            <td style={{ padding: "4px 6px", textAlign: "right" }}>₹{previewData.taxableValue.toFixed(0)}</td>
                            {previewData.isIntraState ? (
                              <>
                                <td style={{ padding: "4px 6px", textAlign: "right" }}>₹{previewData.totalCgst.toFixed(0)}</td>
                                <td style={{ padding: "4px 6px", textAlign: "right" }}>₹{previewData.totalSgst.toFixed(0)}</td>
                              </>
                            ) : (
                              <td style={{ padding: "4px 6px", textAlign: "right" }}>₹{previewData.totalIgst.toFixed(0)}</td>
                            )}
                            <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>₹{previewData.totalGst.toFixed(0)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Right Side: Totals Summary */}
                <div style={{ width: 280, borderTop: `2px solid ${accentCol}`, paddingTop: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10.5 }}>
                    <span>Subtotal</span>
                    <span>{inr(previewData.subtotal)}</span>
                  </div>
                  {previewData.discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10.5, color: "#2e7d32" }}>
                      <span>Discount</span>
                      <span>- {inr(previewData.discount)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10.5 }}>
                    <span>Taxable Amount</span>
                    <span>{inr(previewData.taxableValue)}</span>
                  </div>
                  {previewData.isIntraState ? (
                    <>
                      {previewData.totalCgst > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10.5 }}>
                          <span>CGST</span>
                          <span>{inr(previewData.totalCgst)}</span>
                        </div>
                      )}
                      {previewData.totalSgst > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10.5 }}>
                          <span>SGST</span>
                          <span>{inr(previewData.totalSgst)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    previewData.totalIgst > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10.5 }}>
                        <span>IGST</span>
                        <span>{inr(previewData.totalIgst)}</span>
                      </div>
                    )
                  )}

                  {previewData.shippingCharge > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10.5 }}>
                      <span>Shipping / Delivery</span>
                      <span>{inr(previewData.shippingCharge)}</span>
                    </div>
                  )}
                  {previewData.codFee > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10.5 }}>
                      <span>Cash on Delivery Fee</span>
                      <span>{inr(previewData.codFee)}</span>
                    </div>
                  )}
                  {previewData.donationAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10.5, color: primaryCol }}>
                      <span>Charitable Contribution</span>
                      <span>{inr(previewData.donationAmount)}</span>
                    </div>
                  )}
                  {previewData.roundOff !== 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10.5 }}>
                      <span>Round Off</span>
                      <span>{previewData.roundOff > 0 ? "+" : ""}{inr(previewData.roundOff)}</span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      background: primaryCol,
                      color: "#fff",
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 800,
                      marginTop: 6,
                    }}
                  >
                    <span>GRAND TOTAL</span>
                    <span>{inr(previewData.grandTotal)}</span>
                  </div>

                  <div style={{ fontSize: 9.5, color: "var(--muted)", textAlign: "right", marginTop: 4 }}>
                    Payment Method: <b>{previewData.paymentMethod}</b> ({previewData.paymentStatus})
                  </div>
                </div>
              </div>

              {/* Terms & Authorized Signatory Footer */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr",
                  gap: 20,
                  borderTop: "1px solid #eee",
                  paddingTop: 16,
                  marginTop: 20,
                }}
              >
                {/* Terms */}
                {templateConfig.showTerms !== false && (
                  <div style={{ fontSize: 9, color: "#666", lineHeight: 1.45 }}>
                    <b style={{ color: primaryCol, display: "block", marginBottom: 3 }}>TERMS & CONDITIONS:</b>
                    <div style={{ whiteSpace: "pre-line" }}>{businessInfo.termsAndConditions}</div>
                    {businessInfo.returnsPolicy && (
                      <div style={{ marginTop: 4, fontStyle: "italic" }}>
                        Returns: {businessInfo.returnsPolicy}
                      </div>
                    )}
                  </div>
                )}

                {/* Signatory */}
                {templateConfig.showSignature !== false && (
                  <div
                    style={{
                      border: "1px solid #e5e0eb",
                      borderRadius: 4,
                      padding: "10px 14px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 80,
                    }}
                  >
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: primaryCol }}>
                      {businessInfo.signatoryTitle || `For ${businessInfo.tradeName.toUpperCase()}`}
                    </div>
                    <div style={{ fontSize: 9, color: accentCol, fontStyle: "italic", margin: "14px 0 4px" }}>
                      [ Digitally Authorized Document ]
                    </div>
                    <div style={{ borderTop: "1px solid #ddd", paddingTop: 4, fontSize: 9, fontWeight: 600 }}>
                      {businessInfo.authorizedSignatoryLabel || "Authorized Signatory"}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Copyright & Support */}
              <div
                style={{
                  borderTop: "1px solid #ebe7f0",
                  paddingTop: 12,
                  marginTop: 24,
                  fontSize: 9,
                  color: "var(--muted)",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>{businessInfo.invoiceFooter}</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid var(--line, #ccc)",
  borderRadius: 4,
  fontSize: 12.5,
  background: "#fff",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid var(--line, #ccc)",
  borderRadius: 4,
  fontSize: 12.5,
  background: "#fff",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  display: "block",
  marginBottom: 4,
  color: "#444",
};

const toggleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
  padding: "3px 0",
};
