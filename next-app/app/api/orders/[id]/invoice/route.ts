import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { settingStore } from "@/lib/commerce/store-extensions";

// GET: Fetch invoice data for an order — reads from frozen snapshot
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const order = await store.orders.byId(id);
  if (!order) return json({ error: "Order not found" }, 404);

  // Authorization: customer can only see their own orders, admin can see all
  if (user.role !== "admin" && order.userId !== user.id) {
    return json({ error: "Order not found" }, 404);
  }

  // Try to read the full frozen snapshot (version 2+)
  let snapshot: Record<string, unknown> | null = null;
  try {
    const s = await settingStore.get(`invoice_snapshot_${id}`);
    if (s && s.value) {
      snapshot = typeof s.value === "string" ? JSON.parse(String(s.value)) : s.value as Record<string, unknown>;
    }
  } catch {}

  // Get business info for display
  let businessInfo: Record<string, string> = {};
  try {
    const s = await settingStore.get("business_info");
    if (s && s.value) {
      businessInfo = typeof s.value === "string" ? JSON.parse(String(s.value)) : s.value as Record<string, string>;
    }
  } catch {}

  const buyerState = typeof order.shipping === "object" && order.shipping !== null
    ? String((order.shipping as Record<string, unknown>).state || "")
    : "";

  // Default configs for fallback
  const {
    getBusinessInfo,
    getInvoiceConfig,
    getInvoiceColumnsConfig,
    getInvoiceTemplateConfig,
  } = await import("@/lib/commerce/pricing-engine");
  const { amountInWords } = await import("@/lib/commerce/number-to-words");

  const defaultBiz = await getBusinessInfo();
  const defaultInvCfg = await getInvoiceConfig();
  const defaultColsCfg = await getInvoiceColumnsConfig();
  const defaultTmplCfg = await getInvoiceTemplateConfig();

  // If we have a v2+ snapshot with full tax breakdown, use it directly
  if (snapshot && Number(snapshot.version) >= 2 && Array.isArray(snapshot.lines)) {
    const snapBiz = (snapshot.businessInfo as Record<string, unknown>) || defaultBiz;
    const snapInvCfg = (snapshot.invoiceConfig as Record<string, unknown>) || defaultInvCfg;
    const snapColsCfg = (snapshot.invoiceColumnsConfig as Record<string, unknown>) || defaultColsCfg;
    const snapTmplCfg = (snapshot.invoiceTemplateConfig as Record<string, unknown>) || defaultTmplCfg;

    return json({
      order: {
        id: order.id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      },
      invoice: {
        invoiceNo: snapshot.invoiceNo || `QC-INV-${order.id}`,
        invoiceDate: snapshot.createdAt || order.createdAt,
        orderNo: order.id,
        placeOfSupply: buyerState || (snapBiz.state as string) || "Maharashtra",
        isIntraState: snapshot.totalCgst ? Number(snapshot.totalCgst) > 0 : snapBiz.state === buyerState,
        businessInfo: snapBiz,
        invoiceConfig: snapInvCfg,
        columnsConfig: snapColsCfg,
        templateConfig: snapTmplCfg,
        shipping: order.shipping,
        customer: extractCustomer(order.shipping),
        lines: snapshot.lines,
        subtotal: snapshot.subtotal || 0,
        discount: snapshot.totalDiscount || 0,
        taxableValue: snapshot.taxableProductValue || 0,
        totalCgst: snapshot.totalCgst || 0,
        totalSgst: snapshot.totalSgst || 0,
        totalIgst: snapshot.totalIgst || 0,
        totalGst: snapshot.totalGst || 0,
        shippingCharge: snapshot.shippingCharge || 0,
        shippingTax: snapshot.shippingTax || 0,
        codFee: (snapshot as Record<string, unknown>).codFee || 0,
        otherCharges: snapshot.otherCharges || [],
        totalOtherCharges: snapshot.totalOtherCharges || 0,
        donationAmount: snapshot.donationAmount || 0,
        donationTax: snapshot.donationTax || 0,
        roundOff: snapshot.roundOff || 0,
        grandTotal: snapshot.grandTotal || order.total,
        amountPaid: order.paymentStatus === "paid" ? order.total : 0,
        amountDue: order.paymentStatus === "paid" ? 0 : order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        gstBreakdown: snapshot.gstBreakdown || [],
        amountInWords: snapshot.amountInWords || amountInWords(Number(snapshot.grandTotal || order.total)),
      },
    });
  }

  // Legacy fallback: compute basic invoice from order data (no tax breakdown available)
  const orderLines = Array.isArray(order.lines) ? order.lines : [];
  const productsAll = await store.products.all();
  const lines = orderLines.map((line: Record<string, unknown>) => {
    const p = productsAll.find(x => x.id === line.productId || x.slug === line.productId);
    return {
      productId: String(line.productId || ""),
      name: p?.name || String(line.productId || ""),
      sku: p?.slug || String(line.productId || ""),
      hsnCode: "",
      quantity: Number(line.quantity || 1),
      unitPrice: Number(line.unitPrice || p?.price || 0),
      discount: 0,
      taxableValue: Number(line.unitPrice || 0) * Number(line.quantity || 1),
      gstRate: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      gstTotal: 0,
      lineTotal: Number(line.unitPrice || 0) * Number(line.quantity || 1),
    };
  });

  return json({
    order: {
      id: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    },
    invoice: {
      invoiceNo: snapshot?.invoiceNo || `QC-INV-${order.id}`,
      invoiceDate: order.createdAt,
      orderNo: order.id,
      placeOfSupply: buyerState || defaultBiz.state,
      isIntraState: false,
      businessInfo: defaultBiz,
      invoiceConfig: defaultInvCfg,
      columnsConfig: defaultColsCfg,
      templateConfig: defaultTmplCfg,
      shipping: order.shipping,
      customer: extractCustomer(order.shipping),
      lines,
      subtotal: order.subtotal || 0,
      discount: order.discount || 0,
      taxableValue: order.subtotal || 0,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
      totalGst: 0,
      shippingCharge: order.shippingFee || 0,
      shippingTax: 0,
      otherCharges: [],
      totalOtherCharges: 0,
      donationAmount: (order as Record<string, unknown>).donationAmount || 0,
      donationTax: 0,
      roundOff: 0,
      grandTotal: order.total,
      amountPaid: order.paymentStatus === "paid" ? order.total : 0,
      amountDue: order.paymentStatus === "paid" ? 0 : order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      gstBreakdown: [],
      amountInWords: amountInWords(order.total),
      legacy: true,
    },
  });
}

function extractCustomer(shipping: unknown): { name: string; email: string; phone: string } {
  if (!shipping || typeof shipping !== "object") return { name: "", email: "", phone: "" };
  const s = shipping as Record<string, unknown>;
  return {
    name: String(s.fullName || ""),
    email: String(s.email || ""),
    phone: String(s.phone || ""),
  };
}
