import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { settingStore } from "@/lib/commerce/store-extensions";
import { generateInvoicePdf, type InvoicePdfData } from "@/lib/commerce/invoice-pdf";
import {
  calculateOrderPricing,
  getBusinessInfo,
  getInvoiceConfig,
  getInvoiceColumnsConfig,
  getInvoiceTemplateConfig,
  getTaxConfig,
  getDonationConfig,
  getOtherCharges,
  type BusinessInfo,
  type InvoiceConfig,
  type InvoiceColumnsConfig,
  type InvoiceTemplateConfig,
  type TaxConfig,
} from "@/lib/commerce/pricing-engine";
import { amountInWords } from "@/lib/commerce/number-to-words";

export async function GET(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");

  // Load current settings
  const businessInfo = await getBusinessInfo();
  const invoiceConfig = await getInvoiceConfig();
  const columnsConfig = await getInvoiceColumnsConfig();
  const templateConfig = await getInvoiceTemplateConfig();
  const taxConfig = await getTaxConfig();
  const donationConfig = await getDonationConfig();
  const otherCharges = await getOtherCharges();

  // Discover available logos in public/images/brand/
  const brandDir = path.join(process.cwd(), "public/images/brand");
  const availableLogos: Array<{ label: string; url: string }> = [];
  if (fs.existsSync(brandDir)) {
    try {
      const files = fs.readdirSync(brandDir);
      for (const f of files) {
        if (/\.(png|jpg|jpeg|svg|webp)$/i.test(f)) {
          availableLogos.push({
            label: f.replace(/[-_]/g, " ").replace(/\.[^.]+$/, ""),
            url: `/images/brand/${f}`,
          });
        }
      }
    } catch {}
  }

  // Fetch recent orders for admin preview selector
  const allOrders = (await store.orders.list()) || [];
  const recentOrders = allOrders.slice(0, 15).map((o) => {
    const shipping = (o.shipping || {}) as Record<string, unknown>;
    return {
      id: o.id,
      invoiceNo: (o as Record<string, unknown>).invoiceNo || `QC-INV-${o.id}`,
      customerName: String(shipping.fullName || "Customer"),
      total: o.total,
      createdAt: o.createdAt,
      status: o.status,
    };
  });

  // If a specific real order was requested
  let targetOrderData: unknown = null;
  if (orderId) {
    const realOrder = await store.orders.byId(orderId);
    if (realOrder) {
      let snapshot: Record<string, unknown> | null = null;
      try {
        const s = await settingStore.get(`invoice_snapshot_${orderId}`);
        if (s?.value) {
          snapshot = typeof s.value === "string" ? JSON.parse(String(s.value)) : (s.value as Record<string, unknown>);
        }
      } catch {}

      targetOrderData = { order: realOrder, snapshot };
    }
  }

  // Rich sample order for preview
  const sampleOrder = {
    invoiceNo: "QC-INV-2026-27/01042",
    invoiceDate: new Date().toISOString(),
    orderNo: "QC-ORD-89421",
    placeOfSupply: "Maharashtra",
    isIntraState: true,
    customer: {
      name: "Dr. Aanya Deshmukh",
      email: "aanya.deshmukh@example.com",
      phone: "+91 98201 54321",
      address: "Flat 402, Sea Green Apartments, Worli Sea Face",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400018",
      gstin: "27AAACD1234F1Z2",
    },
    shipping: {
      fullName: "Dr. Aanya Deshmukh",
      email: "aanya.deshmukh@example.com",
      phone: "+91 98201 54321",
      address: "Flat 402, Sea Green Apartments, Worli Sea Face",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400018",
    },
    lines: [
      {
        productId: "cellular-radiance-elixir",
        name: "Cellular Radiance Serum (30ml)",
        sku: "QC-ELX-030",
        hsnCode: "3304",
        quantity: 2,
        unitPrice: 2450,
        discount: 200,
        taxableValue: 4500,
        gstRate: 18,
        cgst: 405,
        sgst: 405,
        igst: 0,
        gstTotal: 810,
        lineTotal: 5310,
      },
      {
        productId: "peptide-barrier-cream",
        name: "Bio-Peptide Barrier Repair Cream (50g)",
        sku: "QC-PEP-050",
        hsnCode: "3304",
        quantity: 1,
        unitPrice: 1850,
        discount: 0,
        taxableValue: 1850,
        gstRate: 18,
        cgst: 166.5,
        sgst: 166.5,
        igst: 0,
        gstTotal: 333,
        lineTotal: 2183,
      },
    ],
    subtotal: 6750,
    discount: 400,
    taxableValue: 6350,
    totalCgst: 571.5,
    totalSgst: 571.5,
    totalIgst: 0,
    totalGst: 1143,
    shippingCharge: 0,
    shippingTax: 0,
    codFee: 0,
    totalOtherCharges: 0,
    donationAmount: 50,
    donationTax: 0,
    roundOff: 0.5,
    grandTotal: 7543,
    amountPaid: 7543,
    amountDue: 0,
    paymentMethod: "UPI (Prepaid)",
    paymentStatus: "paid",
    gstBreakdown: [
      {
        hsnCode: "3304",
        taxableValue: 6350,
        gstRate: 18,
        cgstRate: 9,
        cgstAmount: 571.5,
        sgstRate: 9,
        sgstAmount: 571.5,
        igstRate: 0,
        igstAmount: 0,
        totalTax: 1143,
      },
    ],
    amountInWords: "Indian Rupees Seven Thousand Five Hundred Forty-Three Only",
  };

  return json({
    settings: {
      business_info: businessInfo,
      invoice_config: invoiceConfig,
      invoice_columns_config: columnsConfig,
      invoice_template_config: templateConfig,
      tax_config: taxConfig,
      donation_config: donationConfig,
      other_charges: otherCharges,
    },
    availableLogos,
    recentOrders,
    sampleOrder,
    targetOrderData,
  });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "Invalid payload" }, 422);

  const action = String(body.action || "preview-pdf");

  if (action === "preview-pdf") {
    // Generate preview PDF using live designer state
    const pdfData: InvoicePdfData = body.pdfData;
    if (!pdfData) return json({ error: "Missing invoice data" }, 422);

    try {
      const buf = await generateInvoicePdf(pdfData);
      return new NextResponse(buf as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'inline; filename="QueensCare-Invoice-Preview.pdf"',
          "Cache-Control": "no-store",
        },
      });
    } catch (e) {
      console.error("Preview PDF generation failed:", e);
      return json({ error: "Failed to generate preview PDF." }, 500);
    }
  }

  if (action === "regenerate") {
    const orderId = String(body.orderId || "").trim();
    const reason = String(body.reason || "").trim();
    if (!orderId) return json({ error: "Order ID is required." }, 422);
    if (!reason || reason.length < 5) return json({ error: "A clear reason (min 5 chars) is required for audit logging." }, 422);

    const order = await store.orders.byId(orderId);
    if (!order) return json({ error: "Order not found." }, 404);

    const productsAll = await store.products.all();
    const orderLines = Array.isArray(order.lines) ? order.lines : [];
    const resolvedLines = orderLines.map((l: Record<string, unknown>) => {
      const p = productsAll.find((x) => x.id === l.productId || x.slug === l.productId);
      return {
        productId: String(l.productId || ""),
        name: p?.name || String(l.productId || ""),
        sku: p?.slug || String(l.productId || ""),
        unitPrice: Number(l.unitPrice || p?.price || 0),
        quantity: Number(l.quantity || 1),
        hsnCode: p?.hsnCode || "3304",
      };
    });

    const buyerState =
      typeof order.shipping === "object" && order.shipping !== null
        ? String((order.shipping as Record<string, unknown>).state || "")
        : "";

    const breakdown = await calculateOrderPricing({
      lines: resolvedLines,
      shippingState: buyerState,
      shippingMethod: "standard",
      couponDiscount: order.discount || 0,
      donationAmount: (order as Record<string, unknown>).donationAmount as number || 0,
      paymentMethod: order.paymentMethod || "cod",
    });

    const currentBiz = await getBusinessInfo();
    const currentInvCfg = await getInvoiceConfig();
    const currentColsCfg = await getInvoiceColumnsConfig();
    const currentTmplCfg = await getInvoiceTemplateConfig();

    const newSnapshot = {
      version: 3,
      orderId: order.id,
      invoiceNo: (order as Record<string, unknown>).invoiceNo || `QC-INV-${order.id}`,
      lines: breakdown.lines,
      subtotal: breakdown.subtotal,
      totalDiscount: breakdown.totalDiscount,
      taxableProductValue: breakdown.taxableProductValue,
      totalCgst: breakdown.totalCgst,
      totalSgst: breakdown.totalSgst,
      totalIgst: breakdown.totalIgst,
      totalGst: breakdown.totalGst,
      shippingCharge: breakdown.shippingCharge,
      shippingTax: breakdown.shippingTax,
      shippingMethod: breakdown.shippingMethod,
      codFee: breakdown.codFee,
      otherCharges: breakdown.otherCharges,
      totalOtherCharges: breakdown.totalOtherCharges,
      totalOtherChargesTax: breakdown.totalOtherChargesTax,
      donationAmount: breakdown.donationAmount,
      donationTax: breakdown.donationTax,
      donationTaxTreatment: breakdown.donationTaxTreatment,
      roundOff: breakdown.roundOff,
      grandTotal: breakdown.grandTotal,
      gstBreakdown: breakdown.gstBreakdown,
      amountInWords: breakdown.amountInWords,
      businessInfo: currentBiz,
      invoiceConfig: currentInvCfg,
      invoiceColumnsConfig: currentColsCfg,
      invoiceTemplateConfig: currentTmplCfg,
      paymentMethod: order.paymentMethod,
      shipping: order.shipping,
      couponCode: order.couponCode,
      regeneratedAt: new Date().toISOString(),
      regeneratedBy: user.email,
      regenerationReason: reason,
      createdAt: order.createdAt,
    };

    await settingStore.set(`invoice_snapshot_${order.id}`, newSnapshot, "invoices");

    // Write audit log
    try {
      const logs = ((await settingStore.get("audit_logs")) as unknown as Record<string, unknown>) || { value: [] };
      const logArr = Array.isArray(logs.value) ? logs.value : [];
      logArr.push({
        type: "invoice_regenerated",
        orderId: order.id,
        invoiceNo: newSnapshot.invoiceNo,
        adminUser: user.email,
        reason,
        timestamp: new Date().toISOString(),
      });
      await settingStore.set("audit_logs", logArr.slice(-150), "audit");
    } catch {}

    return json({ success: true, message: `Invoice for order #${order.id} successfully regenerated.`, snapshot: newSnapshot });
  }

  return json({ error: "Invalid action." }, 400);
}
