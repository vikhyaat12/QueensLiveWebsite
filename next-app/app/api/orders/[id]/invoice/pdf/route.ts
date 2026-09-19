import { NextResponse } from "next/server";
import { requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { settingStore } from "@/lib/commerce/store-extensions";
import { generateInvoicePdf, type InvoicePdfData } from "@/lib/commerce/invoice-pdf";
import {
  calculateOrderPricing,
  getBusinessInfo,
  getInvoiceConfig,
  getInvoiceColumnsConfig,
  getInvoiceTemplateConfig,
} from "@/lib/commerce/pricing-engine";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await store.orders.byId(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Strict ownership check (anti-IDOR)
  if (user.role !== "admin" && order.userId !== user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Check query params for download vs inline
  const url = new URL(request.url);
  const isDownload = url.searchParams.get("download") === "1" || url.searchParams.get("dl") === "1";

  // Read frozen invoice snapshot if available
  let snapshot: Record<string, unknown> | null = null;
  try {
    const s = await settingStore.get(`invoice_snapshot_${id}`);
    if (s && s.value) {
      snapshot = typeof s.value === "string" ? JSON.parse(String(s.value)) : (s.value as Record<string, unknown>);
    }
  } catch {}

  const defaultBiz = await getBusinessInfo();
  const defaultInvCfg = await getInvoiceConfig();
  const defaultColsCfg = await getInvoiceColumnsConfig();
  const defaultTmplCfg = await getInvoiceTemplateConfig();

  const buyerState =
    typeof order.shipping === "object" && order.shipping !== null
      ? String((order.shipping as Record<string, unknown>).state || "")
      : "";

  let pdfData: InvoicePdfData;

  if (snapshot && snapshot.version && Array.isArray(snapshot.lines)) {
    // Render from immutable frozen snapshot
    const snapBiz = (snapshot.businessInfo as typeof defaultBiz) || defaultBiz;
    const snapInvCfg = (snapshot.invoiceConfig as typeof defaultInvCfg) || defaultInvCfg;
    const snapColsCfg = (snapshot.invoiceColumnsConfig as typeof defaultColsCfg) || defaultColsCfg;
    const snapTmplCfg = (snapshot.invoiceTemplateConfig as typeof defaultTmplCfg) || defaultTmplCfg;

    const shippingObj = (snapshot.shipping || order.shipping || {}) as Record<string, unknown>;
    const isIntra = snapshot.totalCgst ? Number(snapshot.totalCgst) > 0 : snapBiz.state === buyerState;

    pdfData = {
      invoiceNo: String(snapshot.invoiceNo || `QC-INV-${order.id}`),
      invoiceDate: String(snapshot.createdAt || order.createdAt),
      orderNo: order.id,
      placeOfSupply: buyerState || snapBiz.state,
      isIntraState: isIntra,
      businessInfo: snapBiz,
      invoiceConfig: snapInvCfg,
      columnsConfig: snapColsCfg,
      templateConfig: snapTmplCfg,
      customer: {
        name: String(shippingObj.fullName || user.name || "Customer"),
        email: String(shippingObj.email || user.email || ""),
        phone: String(shippingObj.phone || user.phone || ""),
        address: String(shippingObj.address || ""),
        city: String(shippingObj.city || ""),
        state: String(shippingObj.state || ""),
        pincode: String(shippingObj.pincode || ""),
        gstin: typeof shippingObj.gstin === "string" ? shippingObj.gstin : undefined,
      },
      shipping: {
        fullName: String(shippingObj.fullName || user.name || "Recipient"),
        email: String(shippingObj.email || user.email || ""),
        phone: String(shippingObj.phone || user.phone || ""),
        address: String(shippingObj.address || "Address on file"),
        city: String(shippingObj.city || ""),
        state: String(shippingObj.state || ""),
        pincode: String(shippingObj.pincode || ""),
      },
      lines: (snapshot.lines as Array<Record<string, unknown>>).map((l) => ({
        productId: String(l.productId || ""),
        name: String(l.name || ""),
        sku: String(l.sku || l.productId || ""),
        hsnCode: String(l.hsnCode || "3304"),
        quantity: Number(l.quantity || 1),
        unitPrice: Number(l.unitPrice || 0),
        discount: Number(l.discount || 0),
        taxableValue: Number(l.taxableValue || 0),
        gstRate: Number(l.gstRate || 18),
        cgst: Number(l.cgst || 0),
        sgst: Number(l.sgst || 0),
        igst: Number(l.igst || 0),
        gstTotal: Number(l.gstTotal || 0),
        lineTotal: Number(l.lineTotal || 0),
        taxTreatment: String(l.taxTreatment || "taxable"),
      })),
      subtotal: Number(snapshot.subtotal || 0),
      discount: Number(snapshot.totalDiscount || 0),
      taxableValue: Number(snapshot.taxableProductValue || 0),
      totalCgst: Number(snapshot.totalCgst || 0),
      totalSgst: Number(snapshot.totalSgst || 0),
      totalIgst: Number(snapshot.totalIgst || 0),
      totalGst: Number(snapshot.totalGst || 0),
      shippingCharge: Number(snapshot.shippingCharge || 0),
      shippingTax: Number(snapshot.shippingTax || 0),
      codFee: Number(snapshot.codFee || 0),
      otherCharges: Array.isArray(snapshot.otherCharges) ? (snapshot.otherCharges as never) : [],
      totalOtherCharges: Number(snapshot.totalOtherCharges || 0),
      donationAmount: Number(snapshot.donationAmount || 0),
      donationTax: Number(snapshot.donationTax || 0),
      roundOff: Number(snapshot.roundOff || 0),
      grandTotal: Number(snapshot.grandTotal || order.total),
      amountPaid: order.paymentStatus === "paid" ? order.total : 0,
      amountDue: order.paymentStatus === "paid" ? 0 : order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      gstBreakdown: Array.isArray(snapshot.gstBreakdown) ? (snapshot.gstBreakdown as never) : undefined,
      amountInWords: typeof snapshot.amountInWords === "string" ? snapshot.amountInWords : undefined,
    };
  } else {
    // Legacy fallback: reconstruct authoritative breakdown
    const orderLines = Array.isArray(order.lines) ? order.lines : [];
    const productsAll = await store.products.all();
    const resolvedLines = orderLines.map((line: Record<string, unknown>) => {
      const p = productsAll.find((x) => x.id === line.productId || x.slug === line.productId);
      return {
        productId: String(line.productId || ""),
        name: p?.name || String(line.productId || ""),
        sku: p?.slug || String(line.productId || ""),
        unitPrice: Number(line.unitPrice || p?.price || 0),
        quantity: Number(line.quantity || 1),
        hsnCode: p?.hsnCode || "3304",
      };
    });

    const breakdown = await calculateOrderPricing({
      lines: resolvedLines,
      shippingState: buyerState,
      shippingMethod: "standard",
      couponDiscount: order.discount || 0,
      donationAmount: (order as Record<string, unknown>).donationAmount as number || 0,
      paymentMethod: order.paymentMethod || "cod",
    });

    const shippingObj = (order.shipping || {}) as Record<string, unknown>;

    pdfData = {
      invoiceNo: (order as Record<string, unknown>).invoiceNo as string || `QC-INV-${order.id}`,
      invoiceDate: order.createdAt,
      orderNo: order.id,
      placeOfSupply: buyerState || defaultBiz.state,
      isIntraState: breakdown.totalCgst > 0,
      businessInfo: defaultBiz,
      invoiceConfig: defaultInvCfg,
      columnsConfig: defaultColsCfg,
      templateConfig: defaultTmplCfg,
      customer: {
        name: String(shippingObj.fullName || user.name || "Customer"),
        email: String(shippingObj.email || user.email || ""),
        phone: String(shippingObj.phone || user.phone || ""),
        address: String(shippingObj.address || ""),
        city: String(shippingObj.city || ""),
        state: String(shippingObj.state || ""),
        pincode: String(shippingObj.pincode || ""),
      },
      shipping: {
        fullName: String(shippingObj.fullName || user.name || "Recipient"),
        email: String(shippingObj.email || user.email || ""),
        phone: String(shippingObj.phone || user.phone || ""),
        address: String(shippingObj.address || "Address on file"),
        city: String(shippingObj.city || ""),
        state: String(shippingObj.state || ""),
        pincode: String(shippingObj.pincode || ""),
      },
      lines: breakdown.lines,
      subtotal: breakdown.subtotal,
      discount: breakdown.totalDiscount,
      taxableValue: breakdown.taxableProductValue,
      totalCgst: breakdown.totalCgst,
      totalSgst: breakdown.totalSgst,
      totalIgst: breakdown.totalIgst,
      totalGst: breakdown.totalGst,
      shippingCharge: breakdown.shippingCharge,
      shippingTax: breakdown.shippingTax,
      codFee: breakdown.codFee,
      otherCharges: breakdown.otherCharges,
      totalOtherCharges: breakdown.totalOtherCharges,
      donationAmount: breakdown.donationAmount,
      donationTax: breakdown.donationTax,
      roundOff: breakdown.roundOff,
      grandTotal: breakdown.grandTotal,
      amountPaid: order.paymentStatus === "paid" ? order.total : 0,
      amountDue: order.paymentStatus === "paid" ? 0 : order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      gstBreakdown: breakdown.gstBreakdown,
      amountInWords: breakdown.amountInWords,
    };
  }

  try {
    const pdfBuffer = await generateInvoicePdf(pdfData);
    const filename = `QueensCare-Invoice-${pdfData.invoiceNo.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json({ error: "Failed to generate invoice PDF." }, { status: 500 });
  }
}
