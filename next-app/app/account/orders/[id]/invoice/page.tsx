"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import type {
  BusinessInfo,
  InvoiceConfig,
  InvoiceColumnsConfig,
  InvoiceTemplateConfig,
  GstBreakdownItem,
} from "@/lib/commerce/pricing-engine";

interface InvoiceData {
  invoiceNo: string;
  invoiceDate: string;
  orderNo: string;
  placeOfSupply: string;
  isIntraState: boolean;
  businessInfo: BusinessInfo;
  invoiceConfig?: InvoiceConfig;
  columnsConfig?: InvoiceColumnsConfig;
  templateConfig?: InvoiceTemplateConfig;
  shipping: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
  };
  lines: Array<{
    productId: string;
    name: string;
    sku?: string;
    hsnCode?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxableValue: number;
    gstRate: number;
    cgst: number;
    sgst: number;
    igst: number;
    gstTotal: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discount: number;
  taxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  shippingCharge: number;
  shippingTax: number;
  codFee: number;
  otherCharges?: Array<{ name: string; amount: number; total: number }>;
  totalOtherCharges: number;
  donationAmount: number;
  donationTax: number;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  paymentMethod?: string;
  paymentStatus?: string;
  gstBreakdown?: GstBreakdownItem[];
  amountInWords?: string;
}

const inr = (n: number) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function CustomerInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/orders/${encodeURIComponent(orderId)}/invoice`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.error) setError(d.error);
        else setInvoice(d.invoice);
      })
      .catch(() => {
        if (active) setError("Failed to load invoice details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <main style={{ padding: "80px 20px", textAlign: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--muted, #666)", fontSize: 14 }}>Loading tax invoice…</p>
      </main>
    );
  }

  if (error || !invoice) {
    return (
      <main style={{ padding: "80px 20px", textAlign: "center", minHeight: "60vh" }}>
        <p style={{ color: "#c62828", fontSize: 15, fontWeight: 600 }}>{error || "Invoice not found."}</p>
        <Link
          href="/account"
          style={{
            display: "inline-block",
            marginTop: 16,
            padding: "8px 20px",
            background: "var(--purple, #2A0F3A)",
            color: "#fff",
            borderRadius: 4,
            textDecoration: "none",
            fontSize: 12,
          }}
        >
          ← Back to Account
        </Link>
      </main>
    );
  }

  const biz = invoice.businessInfo || {
    legalName: "Queens Care Laboratories",
    tradeName: "Queens Care Laboratories",
    tagline: "Science with Soul",
    address: "",
    city: "Mumbai",
    state: "Maharashtra",
    stateCode: "27",
    pincode: "",
    country: "India",
    phone: "",
    email: "care@queenscare.in",
    website: "https://queenscare.in",
    gstin: "",
    pan: "",
    cin: "",
    drugLicenseNo: "",
    fssaiLicenseNo: "",
    logoUrl: "/images/brand/queens-care-horizontal-purple.png",
    logoHeight: 46,
    logoAlignment: "left",
    supportPhone: "",
    supportEmail: "care@queenscare.in",
    invoiceFooter: "Thank you for choosing Queens Care Laboratories. For inquiries: care@queenscare.in",
    invoiceNotes: "Computer generated tax invoice. No physical signature required.",
    termsAndConditions: "1. All goods sold are for personal healthcare or prescription-guided care.\n2. Goods once opened cannot be returned due to hygiene and pharmaceutical safety norms.\n3. Discrepancies must be reported within 48 hours of delivery.\n4. Disputes subject to Mumbai jurisdiction.",
    returnsPolicy: "Unopened sealed products may be returned within 7 days of delivery. Refer to queenscare.in/terms.",
    authorizedSignatoryLabel: "Authorized Signatory",
    signatoryTitle: "For QUEENS CARE LABORATORIES",
  };

  const invCfg = invoice.invoiceConfig || {
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
  };

  const cols = invoice.columnsConfig || {
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
  };

  const tmpl = invoice.templateConfig || {
    templateStyle: "default_premium",
    primaryColor: "#2A0F3A",
    accentColor: "#C19A6B",
    fontFamily: "system",
    borderStyle: "elegant",
    showAmountInWords: true,
    showGstBreakupTable: true,
    showTerms: true,
    showSignature: true,
  };

  const primaryCol = tmpl.primaryColor || "#2A0F3A";
  const accentCol = tmpl.accentColor || "#C19A6B";

  const fontFamily =
    tmpl.fontFamily === "serif"
      ? "Georgia, 'Times New Roman', serif"
      : tmpl.fontFamily === "mono"
      ? "'Courier New', Courier, monospace"
      : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  return (
    <div style={{ background: "#f4f3f7", minHeight: "100vh", padding: "30px 16px" }}>
      {/* ─── ACTION TOOLBAR (Hidden in Print) ─── */}
      <div
        className="no-print"
        style={{
          maxWidth: 820,
          margin: "0 auto 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Link
          href={`/account/orders/${encodeURIComponent(orderId)}`}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: primaryCol,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← Back to Order #{orderId}
        </Link>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: "9px 18px",
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#333",
            }}
          >
            <span>🖨️</span> Print Invoice
          </button>

          <a
            href={`/api/orders/${encodeURIComponent(orderId)}/invoice/pdf?download=1`}
            style={{
              padding: "9px 20px",
              background: primaryCol,
              color: "#fff",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 6px rgba(42,15,58,0.25)",
            }}
          >
            <span>📥</span> Download PDF
          </a>
        </div>
      </div>

      {/* ─── A4 LUXURY INVOICE SHEET ─── */}
      <main
        className="qc-invoice-sheet"
        style={{
          maxWidth: 820,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 8,
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          padding: "44px 48px",
          boxSizing: "border-box",
          fontFamily,
          color: "#1C1424",
        }}
      >
        {/* Top Accent Strip */}
        <div style={{ height: 4, background: primaryCol, marginBottom: 20 }} />

        {/* Header: Logo & Company (Left) + TAX INVOICE (Right) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 20 }}>
          <div style={{ maxWidth: 440 }}>
            <img
              src={biz.logoUrl || "/images/brand/queens-care-horizontal-purple.png"}
              alt={biz.tradeName || "Queens Care"}
              style={{
                height: biz.logoHeight || 44,
                maxWidth: 240,
                objectFit: "contain",
                display: "block",
                marginBottom: 8,
              }}
            />
            <h1 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: primaryCol }}>
              {biz.legalName}
            </h1>
            {biz.tagline && (
              <p style={{ margin: "2px 0 6px", fontSize: 11, fontStyle: "italic", color: accentCol }}>
                {biz.tagline}
              </p>
            )}
            <p style={{ margin: 0, fontSize: 10, color: "#555", lineHeight: 1.45 }}>
              {[biz.address, biz.city, biz.state, biz.pincode, biz.country].filter(Boolean).join(", ")}
              {(biz.phone || biz.email || biz.website) && (
                <>
                  <br />
                  {[biz.phone && `Phone: ${biz.phone}`, biz.email && `Email: ${biz.email}`, biz.website && `Website: ${biz.website}`].filter(Boolean).join(" · ")}
                </>
              )}
            </p>
            {(biz.gstin || biz.pan || biz.cin || biz.drugLicenseNo || biz.fssaiLicenseNo) && (
              <p style={{ margin: "6px 0 0", fontSize: 10, fontWeight: 600 }}>
                {[
                  biz.gstin && `GSTIN: ${biz.gstin}`,
                  biz.pan && `PAN: ${biz.pan}`,
                  biz.cin && `CIN: ${biz.cin}`,
                  biz.drugLicenseNo && `DL: ${biz.drugLicenseNo}`,
                  biz.fssaiLicenseNo && `FSSAI: ${biz.fssaiLicenseNo}`,
                ].filter(Boolean).join("   ")}
              </p>
            )}
          </div>

          {/* Right Side: Tax Invoice Badge & Numbering */}
          <div style={{ textAlign: "right", minWidth: 230 }}>
            <div
              style={{
                background: primaryCol,
                color: "#fff",
                padding: "6px 14px",
                borderRadius: 3,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              {invCfg.title || "TAX INVOICE"}
            </div>
            <div style={{ fontSize: 9.5, color: "var(--muted, #666)", textAlign: "center", marginBottom: 12 }}>
              {invCfg.subtitle || "Original for Recipient"}
            </div>

            <div
              style={{
                background: "#fbf9fc",
                border: "1px solid #e5e0eb",
                borderRadius: 4,
                padding: "10px 14px",
                fontSize: 11,
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: "#666" }}>Invoice No:</span>
                <b style={{ color: primaryCol }}>{invoice.invoiceNo}</b>
              </div>
              {invCfg.showInvoiceDate !== false && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: "#666" }}>Date:</span>
                  <span>{new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>
              )}
              {invCfg.showOrderNumber !== false && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: "#666" }}>Order No:</span>
                  <span>{invoice.orderNo}</span>
                </div>
              )}
              {invCfg.showPlaceOfSupply !== false && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: "#666" }}>Place of Supply:</span>
                  <span>{invoice.placeOfSupply}</span>
                </div>
              )}
              {invCfg.showReverseCharge !== false && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#666" }}>Reverse Charge:</span>
                  <span>No</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── BILL TO & SHIP TO PANELS ─── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* Bill To */}
          <div style={{ border: "1px solid #e5e0eb", borderRadius: 4, overflow: "hidden", background: "#fcfbfe" }}>
            <div style={{ background: primaryCol, color: "#fff", padding: "5px 12px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em" }}>
              BILL TO (BUYER DETAILS)
            </div>
            <div style={{ padding: "10px 14px", fontSize: 11, lineHeight: 1.5 }}>
              <b>{invoice.customer.name || "Valued Customer"}</b>
              <div style={{ color: "#555" }}>
                {invoice.customer.address || "Address on record"}
                {invoice.customer.city && `, ${invoice.customer.city}`}
                {invoice.customer.state && `, ${invoice.customer.state}`}
                {invoice.customer.pincode && ` - ${invoice.customer.pincode}`}
              </div>
              <div style={{ color: "#666", fontSize: 10.5, marginTop: 4 }}>
                Phone: {invoice.customer.phone || "—"} · Email: {invoice.customer.email || "—"}
              </div>
              {invoice.customer.gstin && (
                <div style={{ fontWeight: 600, marginTop: 4, color: primaryCol }}>
                  Buyer GSTIN: {invoice.customer.gstin}
                </div>
              )}
            </div>
          </div>

          {/* Ship To */}
          <div style={{ border: "1px solid #e5e0eb", borderRadius: 4, overflow: "hidden", background: "#fcfbfe" }}>
            <div style={{ background: primaryCol, color: "#fff", padding: "5px 12px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em" }}>
              SHIP TO (DISPATCH DESTINATION)
            </div>
            <div style={{ padding: "10px 14px", fontSize: 11, lineHeight: 1.5 }}>
              <b>{invoice.shipping.fullName || invoice.customer.name}</b>
              <div style={{ color: "#555" }}>
                {invoice.shipping.address}<br />
                {invoice.shipping.city}, {invoice.shipping.state} - {invoice.shipping.pincode}
              </div>
              <div style={{ color: "#666", fontSize: 10.5, marginTop: 4 }}>
                Phone: {invoice.shipping.phone || invoice.customer.phone || "—"} · State: {invoice.shipping.state}
              </div>
            </div>
          </div>
        </div>

        {/* ─── ITEMS TABLE ─── */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 24 }}>
          <thead>
            <tr style={{ background: primaryCol, color: "#ffffff", textAlign: "left" }}>
              <th style={{ padding: "7px 10px", width: 28, textAlign: "center" }}>#</th>
              <th style={{ padding: "7px 10px" }}>Product Description</th>
              {cols.showHsn && <th style={{ padding: "7px 10px", textAlign: "center" }}>HSN/SAC</th>}
              {cols.showQuantity && <th style={{ padding: "7px 10px", textAlign: "center" }}>Qty</th>}
              {cols.showUnitPrice && <th style={{ padding: "7px 10px", textAlign: "right" }}>Rate</th>}
              {cols.showDiscount && <th style={{ padding: "7px 10px", textAlign: "right" }}>Disc</th>}
              {cols.showTaxableValue && <th style={{ padding: "7px 10px", textAlign: "right" }}>Taxable</th>}
              {cols.showGstRate && <th style={{ padding: "7px 10px", textAlign: "right" }}>GST %</th>}
              {invoice.isIntraState ? (
                <>
                  {cols.showCgst && <th style={{ padding: "7px 10px", textAlign: "right" }}>CGST</th>}
                  {cols.showSgst && <th style={{ padding: "7px 10px", textAlign: "right" }}>SGST</th>}
                </>
              ) : (
                cols.showIgst && <th style={{ padding: "7px 10px", textAlign: "right" }}>IGST</th>
              )}
              {cols.showLineTotal && <th style={{ padding: "7px 10px", textAlign: "right" }}>Total</th>}
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((l, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #ebe7f0", background: i % 2 === 1 ? "#faf9fc" : "#fff" }}>
                <td style={{ padding: "8px 10px", textAlign: "center" }}>{i + 1}</td>
                <td style={{ padding: "8px 10px" }}>
                  <b>{l.name}</b>
                  {cols.showSku && l.sku && (
                    <div style={{ fontSize: 10, color: "#777" }}>SKU: {l.sku}</div>
                  )}
                </td>
                {cols.showHsn && <td style={{ padding: "8px 10px", textAlign: "center" }}>{l.hsnCode || "3304"}</td>}
                {cols.showQuantity && <td style={{ padding: "8px 10px", textAlign: "center" }}>{l.quantity}</td>}
                {cols.showUnitPrice && <td style={{ padding: "8px 10px", textAlign: "right" }}>{inr(l.unitPrice)}</td>}
                {cols.showDiscount && <td style={{ padding: "8px 10px", textAlign: "right", color: l.discount ? "#2e7d32" : "inherit" }}>{l.discount ? `-${inr(l.discount)}` : "—"}</td>}
                {cols.showTaxableValue && <td style={{ padding: "8px 10px", textAlign: "right" }}>{inr(l.taxableValue)}</td>}
                {cols.showGstRate && <td style={{ padding: "8px 10px", textAlign: "right" }}>{l.gstRate}%</td>}
                {invoice.isIntraState ? (
                  <>
                    {cols.showCgst && <td style={{ padding: "8px 10px", textAlign: "right" }}>{l.cgst ? inr(l.cgst) : "—"}</td>}
                    {cols.showSgst && <td style={{ padding: "8px 10px", textAlign: "right" }}>{l.sgst ? inr(l.sgst) : "—"}</td>}
                  </>
                ) : (
                  cols.showIgst && <td style={{ padding: "8px 10px", textAlign: "right" }}>{l.igst ? inr(l.igst) : "—"}</td>
                )}
                {cols.showLineTotal && <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>{inr(l.lineTotal)}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {/* ─── TOTALS & GST BREAKUP SECTION ─── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 28, marginBottom: 24 }}>
          {/* Left Side: Amount In Words & HSN GST Breakdown */}
          <div style={{ flex: 1 }}>
            {tmpl.showAmountInWords !== false && invoice.amountInWords && (
              <div style={{ padding: "10px 14px", background: "#fcfbfe", border: "1px solid #e5e0eb", borderRadius: 4, marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: primaryCol, textTransform: "uppercase" }}>Amount in Words:</div>
                <div style={{ fontSize: 11, fontStyle: "italic", marginTop: 2 }}>{invoice.amountInWords}</div>
              </div>
            )}

            {/* GST Breakdown Table */}
            {tmpl.showGstBreakupTable !== false && Array.isArray(invoice.gstBreakdown) && invoice.gstBreakdown.length > 0 && (
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: primaryCol, marginBottom: 6, textTransform: "uppercase" }}>
                  Tax Summary (HSN/SAC Breakdown)
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, border: "1px solid #e5e0eb" }}>
                  <thead>
                    <tr style={{ background: "#ede9f3", color: primaryCol }}>
                      <th style={{ padding: "5px 8px", textAlign: "center" }}>HSN/SAC</th>
                      <th style={{ padding: "5px 8px", textAlign: "right" }}>Taxable</th>
                      {invoice.isIntraState ? (
                        <>
                          <th style={{ padding: "5px 8px", textAlign: "right" }}>CGST</th>
                          <th style={{ padding: "5px 8px", textAlign: "right" }}>SGST</th>
                        </>
                      ) : (
                        <th style={{ padding: "5px 8px", textAlign: "right" }}>IGST</th>
                      )}
                      <th style={{ padding: "5px 8px", textAlign: "right" }}>Total Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.gstBreakdown.map((item, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "5px 8px", textAlign: "center" }}>{item.hsnCode}</td>
                        <td style={{ padding: "5px 8px", textAlign: "right" }}>{inr(item.taxableValue)}</td>
                        {invoice.isIntraState ? (
                          <>
                            <td style={{ padding: "5px 8px", textAlign: "right" }}>{inr(item.cgstAmount)}</td>
                            <td style={{ padding: "5px 8px", textAlign: "right" }}>{inr(item.sgstAmount)}</td>
                          </>
                        ) : (
                          <td style={{ padding: "5px 8px", textAlign: "right" }}>{inr(item.igstAmount)}</td>
                        )}
                        <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700 }}>{inr(item.totalTax)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Side: Totals Summary */}
          <div style={{ width: 290, borderTop: `2px solid ${accentCol}`, paddingTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11 }}>
              <span>Subtotal</span>
              <span>{inr(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11, color: "#2e7d32" }}>
                <span>Discount</span>
                <span>- {inr(invoice.discount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11 }}>
              <span>Taxable Amount</span>
              <span>{inr(invoice.taxableValue)}</span>
            </div>
            {invoice.isIntraState ? (
              <>
                {invoice.totalCgst > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11 }}>
                    <span>CGST</span>
                    <span>{inr(invoice.totalCgst)}</span>
                  </div>
                )}
                {invoice.totalSgst > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11 }}>
                    <span>SGST</span>
                    <span>{inr(invoice.totalSgst)}</span>
                  </div>
                )}
              </>
            ) : (
              invoice.totalIgst > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11 }}>
                  <span>IGST</span>
                  <span>{inr(invoice.totalIgst)}</span>
                </div>
              )
            )}

            {invoice.shippingCharge > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11 }}>
                <span>Shipping / Delivery</span>
                <span>{inr(invoice.shippingCharge)}</span>
              </div>
            )}
            {invoice.codFee > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11 }}>
                <span>Cash on Delivery Fee</span>
                <span>{inr(invoice.codFee)}</span>
              </div>
            )}
            {invoice.totalOtherCharges > 0 && Array.isArray(invoice.otherCharges) && invoice.otherCharges.map((oc, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11 }}>
                <span>{oc.name}</span>
                <span>{inr(oc.total || oc.amount)}</span>
              </div>
            ))}
            {invoice.donationAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11, color: primaryCol }}>
                <span>Charitable Contribution</span>
                <span>{inr(invoice.donationAmount)}</span>
              </div>
            )}
            {invoice.roundOff !== 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11 }}>
                <span>Round Off</span>
                <span>{invoice.roundOff > 0 ? "+" : ""}{inr(invoice.roundOff)}</span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "9px 12px",
                background: primaryCol,
                color: "#fff",
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 800,
                marginTop: 8,
              }}
            >
              <span>GRAND TOTAL</span>
              <span>{inr(invoice.grandTotal)}</span>
            </div>

            <div style={{ fontSize: 10, color: "var(--muted, #666)", textAlign: "right", marginTop: 6 }}>
              Payment Method: <b>{String(invoice.paymentMethod || "COD").toUpperCase()}</b> ({invoice.amountPaid > 0 ? "Paid" : "Pending"})
            </div>
          </div>
        </div>

        {/* ─── TERMS & AUTHORIZED SIGNATORY ─── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 24,
            borderTop: "1px solid #eee",
            paddingTop: 18,
            marginTop: 20,
          }}
        >
          {/* Terms */}
          {tmpl.showTerms !== false && (
            <div style={{ fontSize: 9.5, color: "#666", lineHeight: 1.5 }}>
              <b style={{ color: primaryCol, display: "block", marginBottom: 4 }}>TERMS & CONDITIONS:</b>
              <div style={{ whiteSpace: "pre-line" }}>{biz.termsAndConditions}</div>
              {biz.returnsPolicy && (
                <div style={{ marginTop: 6, fontStyle: "italic" }}>
                  Returns: {biz.returnsPolicy}
                </div>
              )}
            </div>
          )}

          {/* Signatory */}
          {tmpl.showSignature !== false && (
            <div
              style={{
                border: "1px solid #e5e0eb",
                borderRadius: 4,
                padding: "12px 16px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 85,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: primaryCol }}>
                {biz.signatoryTitle || `For ${biz.tradeName.toUpperCase()}`}
              </div>
              <div style={{ fontSize: 9.5, color: accentCol, fontStyle: "italic", margin: "16px 0 6px" }}>
                [ Digitally Authorized Document ]
              </div>
              <div style={{ borderTop: "1px solid #ddd", paddingTop: 4, fontSize: 9.5, fontWeight: 600 }}>
                {biz.authorizedSignatoryLabel || "Authorized Signatory"}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #ebe7f0",
            paddingTop: 14,
            marginTop: 24,
            fontSize: 9.5,
            color: "var(--muted, #666)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{biz.invoiceFooter}</span>
          <span>Page 1 of 1</span>
        </div>
      </main>

      {/* ─── PRINT CSS STYLES ─── */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .qc-invoice-sheet {
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 20px 24px !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
