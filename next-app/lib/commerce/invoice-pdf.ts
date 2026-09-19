import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { amountInWords } from "./number-to-words";
import type {
  BusinessInfo,
  InvoiceConfig,
  InvoiceColumnsConfig,
  InvoiceTemplateConfig,
  GstBreakdownItem,
} from "./pricing-engine";

export interface InvoicePdfData {
  invoiceNo: string;
  invoiceDate: string;
  orderNo: string;
  placeOfSupply: string;
  isIntraState: boolean;
  businessInfo: BusinessInfo;
  invoiceConfig?: InvoiceConfig;
  columnsConfig?: InvoiceColumnsConfig;
  templateConfig?: InvoiceTemplateConfig;
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
  shipping: {
    fullName: string;
    email?: string;
    phone?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
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
    taxTreatment?: string;
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
  otherCharges?: Array<{ name: string; amount: number; gstAmount?: number; total: number }>;
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
  `INR ${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const safeNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const safeFixed = (v: unknown, digits = 0): string =>
  safeNum(v).toFixed(digits);

const compactInr = (n: unknown): string =>
  `Rs. ${safeNum(n).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

function formatDisplayDate(dateStr?: string | Date): string {
  if (!dateStr) return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  if (typeof dateStr === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split("/");
    const parsed = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    }
    return dateStr;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }
  return String(dateStr);
}

/**
 * Resolves an image buffer from local filesystem or URL.
 */
function resolveImageBuffer(logoPathOrUrl?: string): Buffer | null {
  if (!logoPathOrUrl) {
    // Default fallback to high-res horizontal logo
    const defaultLocal = path.join(
      process.cwd(),
      "public/images/brand/queens-care-horizontal-purple.png"
    );
    if (fs.existsSync(defaultLocal)) {
      return fs.readFileSync(defaultLocal);
    }
    return null;
  }

  // Check if it is a local public path (e.g. /images/brand/...)
  if (logoPathOrUrl.startsWith("/")) {
    const local = path.join(process.cwd(), "public", logoPathOrUrl.replace(/^\//, ""));
    if (fs.existsSync(local)) {
      return fs.readFileSync(local);
    }
  }

  // Check direct local filesystem path
  if (fs.existsSync(logoPathOrUrl)) {
    return fs.readFileSync(logoPathOrUrl);
  }

  return null;
}

/**
 * Generates a luxury, production-grade Indian GST Tax Invoice in A4 PDF format.
 */
export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  const biz = data.businessInfo;
  const cfg = data.invoiceConfig || {
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

  const cols = data.columnsConfig || {
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

  const tmpl = data.templateConfig || {
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

  const primaryColor = tmpl.primaryColor || "#2A0F3A";
  const accentColor = tmpl.accentColor || "#C19A6B";
  const darkTextColor = "#1C1424";
  const mutedTextColor = "#5D5766";
  const lineBorderColor = "#E4E0EB";
  const lightBgColor = "#F9F8FB";

  return new Promise<Buffer>((resolve, reject) => {
    // A4 dimensions: 595.28 x 841.89 points
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 30, bottom: 25, left: 36, right: 36 },
      bufferPages: true,
      info: {
        Title: `${cfg.title || "TAX INVOICE"} - ${data.invoiceNo}`,
        Author: biz.tradeName || "Queens Care Laboratories",
        Subject: `Tax Invoice for Order #${data.orderNo}`,
        Keywords: "Tax Invoice, GST, Queens Care Laboratories",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err: Error) => reject(err));

    const left = 36;
    const right = 559.28;
    const contentWidth = right - left; // 523.28 pt

    // ─── 1. TOP HEADER & BRAND ───
    let y = 34;

    // Optional Accent Top Bar
    doc.rect(left, y, contentWidth, 3).fill(primaryColor);
    y += 10;

    // Logo
    const logoBuffer = resolveImageBuffer(biz.logoUrl);
    const logoHeight = Math.min(biz.logoHeight || 42, 48);

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, left, y, { height: logoHeight });
      } catch {
        // Fallback text if image parsing fails
        doc.font("Helvetica-Bold").fontSize(16).fillColor(primaryColor).text(biz.tradeName || "QUEENS CARE", left, y);
      }
    } else {
      doc.font("Helvetica-Bold").fontSize(16).fillColor(primaryColor).text(biz.tradeName || "QUEENS CARE", left, y);
    }

    // Right Side: TAX INVOICE Badge & Metadata
    const metaX = 350;
    const metaW = right - metaX;
    doc.rect(metaX, y, metaW, 20).fill(primaryColor);
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#FFFFFF")
      .text(cfg.title || "TAX INVOICE", metaX, y + 4, { width: metaW, align: "center" });

    doc.font("Helvetica").fontSize(7.5).fillColor(mutedTextColor)
      .text(cfg.subtitle || "Original for Recipient", metaX, y + 23, { width: metaW, align: "center" });

    // Header Details Below Logo (Left Side)
    const headerDetailsY = y + logoHeight + 6;
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(primaryColor)
      .text(biz.legalName || "Queens Care Laboratories Pvt. Ltd.", left, headerDetailsY);

    if (biz.tagline) {
      doc.font("Helvetica-Oblique").fontSize(7.5).fillColor(accentColor)
        .text(biz.tagline, left, headerDetailsY + 12);
    }

    const addrY = headerDetailsY + (biz.tagline ? 22 : 14);
    doc.font("Helvetica").fontSize(7.5).fillColor(mutedTextColor).lineGap(1.5)
      .text(`${biz.address}, ${biz.city}, ${biz.state} - ${biz.pincode}, ${biz.country}`, left, addrY, { width: 300 });

    const contactY = doc.y + 1;
    doc.text(`Phone: ${biz.phone}  |  Email: ${biz.email}  |  Website: ${biz.website}`, left, contactY, { width: 300 });

    const taxY = doc.y + 1;
    let taxIds = "";
    if (biz.gstin) taxIds += `GSTIN: ${biz.gstin}   `;
    if (biz.pan) taxIds += `PAN: ${biz.pan}   `;
    if (biz.cin) taxIds += `CIN: ${biz.cin}`;
    if (taxIds) {
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(darkTextColor).text(taxIds.trim(), left, taxY, { width: 300 });
    }

    // Right Side: Invoice Key Value Pair Box
    const invoiceBoxY = y + 36;
    doc.rect(metaX, invoiceBoxY, metaW, 72).fillAndStroke(lightBgColor, lineBorderColor);

    let infoY = invoiceBoxY + 6;
    const printMetaRow = (label: string, value: string, isBold = false) => {
      doc.font("Helvetica").fontSize(7.5).fillColor(mutedTextColor).text(label, metaX + 8, infoY, { width: 75 });
      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(7.5).fillColor(darkTextColor)
        .text(value, metaX + 85, infoY, { width: metaW - 90, align: "right" });
      infoY += 12;
    };

    printMetaRow("Invoice No:", data.invoiceNo, true);
    if (cfg.showInvoiceDate !== false) {
      printMetaRow("Invoice Date:", formatDisplayDate(data.invoiceDate));
    }
    if (cfg.showOrderNumber !== false) {
      printMetaRow("Order No:", data.orderNo);
    }
    if (cfg.showPlaceOfSupply !== false && data.placeOfSupply) {
      const pos = String(data.placeOfSupply);
      const displayPos = pos.includes("Code:") ? pos : `${pos}${biz.stateCode && pos === biz.state ? ` (Code: ${biz.stateCode})` : ""}`;
      printMetaRow("Place of Supply:", displayPos);
    }
    if (cfg.showReverseCharge !== false) {
      printMetaRow("Reverse Charge:", "No");
    }

    y = Math.max(doc.y + 10, invoiceBoxY + 80);

    // Separator line
    doc.moveTo(left, y).lineTo(right, y).strokeColor(lineBorderColor).lineWidth(0.75).stroke();
    y += 8;

    // ─── 2. BILL TO & SHIP TO PANELS ───
    const colW = (contentWidth - 14) / 2;
    const billToX = left;
    const shipToX = left + colW + 14;
    const boxHeight = 72;

    // Bill To Box
    doc.rect(billToX, y, colW, boxHeight).fillAndStroke(lightBgColor, lineBorderColor);
    doc.rect(billToX, y, colW, 16).fill(primaryColor);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#FFFFFF")
      .text("BILL TO (BUYER DETAILS)", billToX + 8, y + 4);

    let billY = y + 20;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(darkTextColor)
      .text(data.customer.name || "Valued Customer", billToX + 8, billY);
    billY += 10;
    doc.font("Helvetica").fontSize(7.5).fillColor(mutedTextColor).lineGap(1);
    const billAddr = data.customer.address
      ? `${data.customer.address}, ${data.customer.city || ""}, ${data.customer.state || ""} ${data.customer.pincode || ""}`
      : "Address as per order";
    doc.text(billAddr, billToX + 8, billY, { width: colW - 16, height: 20 });
    billY += 21;
    doc.text(`Phone: ${data.customer.phone || "—"}  |  Email: ${data.customer.email || "—"}`, billToX + 8, billY, { width: colW - 16 });
    if (data.customer.gstin) {
      billY += 9;
      doc.font("Helvetica-Bold").text(`GSTIN: ${data.customer.gstin}`, billToX + 8, billY);
    }

    // Ship To Box
    doc.rect(shipToX, y, colW, boxHeight).fillAndStroke(lightBgColor, lineBorderColor);
    doc.rect(shipToX, y, colW, 16).fill(primaryColor);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#FFFFFF")
      .text("SHIP TO (DISPATCH DESTINATION)", shipToX + 8, y + 4);

    let shipY = y + 20;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(darkTextColor)
      .text(data.shipping.fullName || data.customer.name || "Recipient", shipToX + 8, shipY);
    shipY += 10;
    doc.font("Helvetica").fontSize(7.5).fillColor(mutedTextColor).lineGap(1);
    const shipAddr = `${data.shipping.address}, ${data.shipping.city}, ${data.shipping.state} - ${data.shipping.pincode}`;
    doc.text(shipAddr, shipToX + 8, shipY, { width: colW - 16, height: 20 });
    shipY += 21;
    doc.text(`Phone: ${data.shipping.phone || data.customer.phone || "—"}  |  State: ${data.shipping.state}`, shipToX + 8, shipY, { width: colW - 16 });

    y += boxHeight + 10;

    // ─── 3. PRODUCT ITEMS TABLE ───
    // Build table column widths based on visibility configuration
    const isIntraState = data.isIntraState;
    const showHsn = cols.showHsn !== false;
    const showSku = cols.showSku !== false;
    const showDisc = cols.showDiscount !== false && data.discount > 0;
    const showRate = cols.showUnitPrice !== false;
    const showTaxable = cols.showTaxableValue !== false;
    const showGstRate = cols.showGstRate !== false;
    const showCgstSgst = isIntraState && (cols.showCgst !== false || cols.showSgst !== false);
    const showIgst = !isIntraState && cols.showIgst !== false;

    // Dynamic width assignment
    const colDefs: Array<{ key: string; label: string; width: number; align: "left" | "right" | "center" }> = [];
    colDefs.push({ key: "index", label: "#", width: 22, align: "center" });

    // Item name takes remaining space
    let fixedWidth = 22 + 28 + 48; // index + qty + total
    if (showHsn) fixedWidth += 42;
    if (showRate) fixedWidth += 44;
    if (showDisc) fixedWidth += 38;
    if (showTaxable) fixedWidth += 46;
    if (showGstRate) fixedWidth += 34;
    if (showCgstSgst) fixedWidth += 76; // cgst 38 + sgst 38
    if (showIgst) fixedWidth += 44;

    const descWidth = Math.max(120, contentWidth - fixedWidth);
    colDefs.push({ key: "desc", label: "Product Description", width: descWidth, align: "left" });
    if (showHsn) colDefs.push({ key: "hsn", label: "HSN/SAC", width: 42, align: "center" });
    colDefs.push({ key: "qty", label: "Qty", width: 28, align: "center" });
    if (showRate) colDefs.push({ key: "rate", label: "Rate", width: 44, align: "right" });
    if (showDisc) colDefs.push({ key: "disc", label: "Disc", width: 38, align: "right" });
    if (showTaxable) colDefs.push({ key: "taxable", label: "Taxable", width: 46, align: "right" });
    if (showGstRate) colDefs.push({ key: "gstRate", label: "GST %", width: 34, align: "right" });
    if (showCgstSgst) {
      colDefs.push({ key: "cgst", label: "CGST", width: 38, align: "right" });
      colDefs.push({ key: "sgst", label: "SGST", width: 38, align: "right" });
    }
    if (showIgst) {
      colDefs.push({ key: "igst", label: "IGST", width: 44, align: "right" });
    }
    colDefs.push({ key: "total", label: "Total", width: 48, align: "right" });

    // Render Table Header
    const tableHeaderHeight = 18;
    doc.rect(left, y, contentWidth, tableHeaderHeight).fill(primaryColor);

    let curX = left;
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#FFFFFF");
    for (const c of colDefs) {
      doc.text(c.label, curX + 2, y + 5, { width: c.width - 4, align: c.align });
      curX += c.width;
    }
    y += tableHeaderHeight;

    // Render Rows
    let rowIndex = 0;
    for (const line of data.lines) {
      // Check for page overflow
      if (y > 700) {
        doc.addPage();
        y = 40;
        // Repeat table header on new page
        doc.rect(left, y, contentWidth, tableHeaderHeight).fill(primaryColor);
        curX = left;
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#FFFFFF");
        for (const c of colDefs) {
          doc.text(c.label, curX + 2, y + 5, { width: c.width - 4, align: c.align });
          curX += c.width;
        }
        y += tableHeaderHeight;
      }

      rowIndex++;
      const isEven = rowIndex % 2 === 0;
      const rowHeight = showSku && line.sku ? 24 : 18;

      if (isEven) {
        doc.rect(left, y, contentWidth, rowHeight).fill("#FAFAFC");
      }

      curX = left;
      for (const c of colDefs) {
        doc.font("Helvetica").fontSize(7.5).fillColor(darkTextColor);
        if (c.key === "index") {
          doc.text(String(rowIndex), curX + 2, y + 4, { width: c.width - 4, align: c.align });
        } else if (c.key === "desc") {
          doc.font("Helvetica-Bold").text(line.name, curX + 4, y + 3, { width: c.width - 8, height: 11, ellipsis: true });
          if (showSku && line.sku) {
            doc.font("Helvetica").fontSize(6.5).fillColor(mutedTextColor)
              .text(`SKU: ${line.sku}`, curX + 4, y + 13, { width: c.width - 8 });
          }
        } else if (c.key === "hsn") {
          doc.text(line.hsnCode || "3304", curX + 2, y + 4, { width: c.width - 4, align: c.align });
        } else if (c.key === "qty") {
          doc.text(String(line.quantity), curX + 2, y + 4, { width: c.width - 4, align: c.align });
        } else if (c.key === "rate") {
          doc.text(compactInr(line.unitPrice), curX + 2, y + 4, { width: c.width - 4, align: c.align });
        } else if (c.key === "disc") {
          doc.text(line.discount ? `- ${compactInr(line.discount)}` : "—", curX + 2, y + 4, { width: c.width - 4, align: c.align });
        } else if (c.key === "taxable") {
          doc.text(compactInr(line.taxableValue), curX + 2, y + 4, { width: c.width - 4, align: c.align });
        } else if (c.key === "gstRate") {
          doc.text(`${safeFixed(line.gstRate)}%`, curX + 2, y + 4, { width: c.width - 4, align: c.align });
        } else if (c.key === "cgst") {
          doc.text(line.cgst ? compactInr(line.cgst) : "—", curX + 2, y + 4, { width: c.width - 4, align: c.align });
        } else if (c.key === "sgst") {
          doc.text(line.sgst ? compactInr(line.sgst) : "—", curX + 2, y + 4, { width: c.width - 4, align: c.align });
        } else if (c.key === "igst") {
          doc.text(line.igst ? compactInr(line.igst) : "—", curX + 2, y + 4, { width: c.width - 4, align: c.align });
        } else if (c.key === "total") {
          doc.font("Helvetica-Bold").text(compactInr(line.lineTotal), curX + 2, y + 4, { width: c.width - 4, align: c.align });
        }
        curX += c.width;
      }

      // Border line below row
      doc.moveTo(left, y + rowHeight).lineTo(right, y + rowHeight).strokeColor("#ECEAF0").lineWidth(0.5).stroke();
      y += rowHeight;
    }

    y += 10;

    // ─── 4. TOTALS & FINANCIAL SUMMARY ───
    // Check if totals block fits on this page, otherwise break
    if (y > 660) {
      doc.addPage();
      y = 40;
    }

    const summaryW = 210;
    const summaryX = right - summaryW;
    const leftNotesW = summaryX - left - 16;

    // Totals Panel (Right)
    doc.rect(summaryX, y, summaryW, 2).fill(accentColor);
    let totY = y + 6;

    const printTotRow = (label: string, val: string, isDiscount = false, isBold = false) => {
      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(7.5)
        .fillColor(isDiscount ? "#2E7D32" : darkTextColor)
        .text(label, summaryX + 4, totY, { width: 110 });
      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(7.5)
        .fillColor(isDiscount ? "#2E7D32" : darkTextColor)
        .text(val, summaryX + 115, totY, { width: summaryW - 120, align: "right" });
      totY += 12;
    };

    printTotRow("Subtotal", inr(data.subtotal));
    if (data.discount > 0) {
      printTotRow("Discount", `- ${inr(data.discount)}`, true);
    }
    printTotRow("Taxable Value", inr(data.taxableValue));

    if (isIntraState) {
      if (data.totalCgst > 0) printTotRow("CGST", inr(data.totalCgst));
      if (data.totalSgst > 0) printTotRow("SGST", inr(data.totalSgst));
    } else {
      if (data.totalIgst > 0) printTotRow("IGST", inr(data.totalIgst));
    }

    if (data.shippingCharge > 0) {
      printTotRow("Shipping / Delivery", inr(data.shippingCharge));
    }
    if (data.codFee > 0) {
      printTotRow("Cash on Delivery Fee", inr(data.codFee));
    }
    if (data.totalOtherCharges > 0 && Array.isArray(data.otherCharges)) {
      for (const oc of data.otherCharges) {
        printTotRow(oc.name, inr(oc.total || oc.amount));
      }
    }
    if (data.donationAmount > 0) {
      printTotRow("Charitable Contribution", inr(data.donationAmount));
    }
    if (data.roundOff !== 0) {
      printTotRow("Round Off", `${data.roundOff > 0 ? "+" : ""}${inr(data.roundOff)}`);
    }

    // Grand Total Row Highlight
    totY += 3;
    doc.rect(summaryX, totY, summaryW, 22).fill(primaryColor);
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#FFFFFF")
      .text("GRAND TOTAL", summaryX + 8, totY + 6);
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#FFFFFF")
      .text(inr(data.grandTotal), summaryX + 90, totY + 6, { width: summaryW - 98, align: "right" });
    totY += 26;

    // Payment Status Row
    doc.font("Helvetica").fontSize(7.5).fillColor(mutedTextColor)
      .text(`Payment Method: ${String(data.paymentMethod || "COD").toUpperCase()}   |   Status: ${String(data.paymentStatus || "Paid").toUpperCase()}`, summaryX + 4, totY, { width: summaryW - 8, align: "right" });

    // Left Notes: Amount In Words & HSN GST Summary Table
    let leftY = y + 4;
    const wordsText = data.amountInWords || amountInWords(data.grandTotal);
    doc.rect(left, leftY, leftNotesW, 28).fillAndStroke(lightBgColor, lineBorderColor);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(primaryColor)
      .text("AMOUNT IN WORDS:", left + 8, leftY + 5);
    doc.font("Helvetica-Oblique").fontSize(7.5).fillColor(darkTextColor)
      .text(wordsText, left + 8, leftY + 14, { width: leftNotesW - 16 });

    leftY += 36;

    // GST Summary Table (HSN/SAC Breakup)
    if (tmpl.showGstBreakupTable !== false && Array.isArray(data.gstBreakdown) && data.gstBreakdown.length > 0) {
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(primaryColor)
        .text("TAX SUMMARY (HSN/SAC BREAKDOWN)", left, leftY);
      leftY += 10;

      const gstColDefs = isIntraState
        ? [
            { label: "HSN/SAC", width: 44, align: "center" as const },
            { label: "Taxable", width: 50, align: "right" as const },
            { label: "CGST", width: 46, align: "right" as const },
            { label: "SGST", width: 46, align: "right" as const },
            { label: "Total Tax", width: 54, align: "right" as const },
          ]
        : [
            { label: "HSN/SAC", width: 50, align: "center" as const },
            { label: "Taxable", width: 60, align: "right" as const },
            { label: "IGST Rate", width: 44, align: "right" as const },
            { label: "IGST Amt", width: 48, align: "right" as const },
            { label: "Total Tax", width: 54, align: "right" as const },
          ];

      const gstTblW = gstColDefs.reduce((acc, c) => acc + c.width, 0);
      doc.rect(left, leftY, gstTblW, 14).fill(primaryColor);
      let gx = left;
      doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#FFFFFF");
      for (const gc of gstColDefs) {
        doc.text(gc.label, gx + 2, leftY + 3, { width: gc.width - 4, align: gc.align });
        gx += gc.width;
      }
      leftY += 14;

      for (const item of data.gstBreakdown) {
        doc.rect(left, leftY, gstTblW, 12).fillAndStroke("#FFFFFF", "#ECEAF0");
        gx = left;
        doc.font("Helvetica").fontSize(6.5).fillColor(darkTextColor);

        if (isIntraState) {
          doc.text(item.hsnCode, gx, leftY + 2, { width: 44, align: "center" }); gx += 44;
          doc.text(compactInr(item.taxableValue), gx, leftY + 2, { width: 48, align: "right" }); gx += 50;
          doc.text(compactInr(item.cgstAmount), gx, leftY + 2, { width: 44, align: "right" }); gx += 46;
          doc.text(compactInr(item.sgstAmount), gx, leftY + 2, { width: 44, align: "right" }); gx += 46;
          doc.font("Helvetica-Bold").text(compactInr(item.totalTax), gx, leftY + 2, { width: 52, align: "right" });
        } else {
          doc.text(item.hsnCode, gx, leftY + 2, { width: 50, align: "center" }); gx += 50;
          doc.text(compactInr(item.taxableValue), gx, leftY + 2, { width: 58, align: "right" }); gx += 60;
          doc.text(`${safeFixed(item.igstRate)}%`, gx, leftY + 2, { width: 42, align: "right" }); gx += 44;
          doc.text(compactInr(item.igstAmount), gx, leftY + 2, { width: 46, align: "right" }); gx += 48;
          doc.font("Helvetica-Bold").text(compactInr(item.totalTax), gx, leftY + 2, { width: 52, align: "right" });
        }
        leftY += 12;
      }
    }

    y = Math.max(totY + 16, leftY + 16);

    // ─── 5. TERMS, SIGNATURE & LEGAL ───
    if (y > 720) {
      doc.addPage();
      y = 40;
    }

    const bottomSectionH = 68;
    const termsW = contentWidth - 170;
    const signX = right - 150;

    // Terms & Conditions Block
    if (tmpl.showTerms !== false) {
      doc.font("Helvetica-Bold").fontSize(7).fillColor(primaryColor).text("TERMS & CONDITIONS:", left, y);
      doc.font("Helvetica").fontSize(6.5).fillColor(mutedTextColor).lineGap(1)
        .text(biz.termsAndConditions || "1. Goods once sold are non-returnable.\n2. Inquiries: care@queenscare.in", left, y + 10, { width: termsW, height: 46 });
    }

    // Authorized Signatory Block
    if (tmpl.showSignature !== false) {
      doc.rect(signX, y, 150, bottomSectionH).strokeColor(lineBorderColor).lineWidth(0.5).stroke();
      doc.font("Helvetica-Bold").fontSize(7).fillColor(primaryColor)
        .text(biz.signatoryTitle || `For ${biz.tradeName.toUpperCase()}`, signX + 4, y + 6, { width: 142, align: "center" });

      // Digital verification stamp representation
      doc.font("Helvetica-Oblique").fontSize(6.5).fillColor(accentColor)
        .text("[ Digitally Authorized Document ]", signX + 4, y + 36, { width: 142, align: "center" });

      doc.moveTo(signX + 16, y + 52).lineTo(signX + 134, y + 52).strokeColor(lineBorderColor).lineWidth(0.5).stroke();
      doc.font("Helvetica-Bold").fontSize(7).fillColor(darkTextColor)
        .text(biz.authorizedSignatoryLabel || "Authorized Signatory", signX + 4, y + 55, { width: 142, align: "center" });
    }

    y += bottomSectionH + 10;

    // ─── 6. PAGINATION & FOOTER ───
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      // Bottom footer separator
      doc.moveTo(left, 802).lineTo(right, 802).strokeColor(lineBorderColor).lineWidth(0.5).stroke();

      // Footer Text
      doc.font("Helvetica").fontSize(6.5).fillColor(mutedTextColor)
        .text(
          `${biz.legalName || "Queens Care Laboratories"}  •  ${biz.website || "www.queenscare.in"}  •  Support: ${biz.supportEmail || biz.email}`,
          left,
          808,
          { width: contentWidth - 80, align: "left", lineBreak: false }
        );

      // Page numbering
      doc.font("Helvetica-Bold").fontSize(6.5).fillColor(primaryColor)
        .text(`Page ${i + 1} of ${pages.count}`, right - 70, 808, { width: 70, align: "right", lineBreak: false });
    }

    doc.end();
  });
}
