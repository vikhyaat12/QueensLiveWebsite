import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { affiliateStore, couponStore, paymentGatewayStore, settingStore } from "@/lib/commerce/store-extensions";
import { validateDonation, generateInvoiceNumber, calculateOrderPricing } from "@/lib/commerce/pricing-engine";
import { resolveProductTax } from "@/lib/commerce/tax-rules";
import { inventoryService } from "@/lib/commerce/inventory";
import { emailService } from "@/lib/email/email-service";
import { dispatchNotification } from "@/lib/notifications/notification-orchestrator";
import type { CartLine, ShippingDetails } from "@/lib/commerce/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateShipping(raw: unknown): ShippingDetails | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const fullName = typeof b.fullName === "string" ? b.fullName.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const phone = typeof b.phone === "string" ? b.phone.trim() : "";
  const address = typeof b.address === "string" ? b.address.trim() : "";
  const city = typeof b.city === "string" ? b.city.trim() : "";
  const state = typeof b.state === "string" ? b.state.trim() : "";
  const pincode = typeof b.pincode === "string" ? b.pincode.trim() : "";
  if (!fullName) return null;
  if (!EMAIL_RE.test(email)) return null;
  if (!/^[0-9+\-\s]{8,15}$/.test(phone)) return null;
  if (address.length < 8) return null;
  if (!city) return null;
  if (!state) return null;
  if (!/^\d{6}$/.test(pincode)) return null;
  return { fullName, email, phone, address, city, state, pincode };
}

function lineKey(lines: CartLine[]): string {
  return lines.map((l) => `${l.productId}:${l.quantity}`).sort().join("|");
}

export async function GET() {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  // Strictly return only orders belonging to this user
  const orders = await store.orders.list({ id: user.id, role: "customer" } as never);
  return json({ orders });
}

export async function POST(request: Request) {
  // Checkout/order placement MUST require an authenticated customer account
  const user = await requireUser();
  if (!user) {
    return json({ error: "Authentication required. Please sign in to place an order." }, 401);
  }
  if (user.status === "disabled" || user.status === "deactivated" || user.isActive === false) {
    return json({ error: "Your account is disabled. Please contact customer support." }, 403);
  }
  const userId = user.id;

  const body = await request.json().catch(() => null);
  const lines = Array.isArray(body?.lines) ? body.lines : [];
  if (!lines.length) return json({ error: "Your bag is empty." }, 422);

  const shipping = validateShipping(body?.shipping);
  if (!shipping) return json({ error: "Shipping details are incomplete or invalid." }, 422);

  const errors: Array<{ productId: string; reason: string }> = [];
  const resolvedLines: Array<{
    productId: string;
    name: string;
    variantId?: string;
    variantName?: string;
    sku?: string;
    unitPrice: number;
    quantity: number;
    hsnCode?: string;
    gstRate?: number;
    taxMode?: "taxable" | "exempt" | "zero_rated";
    taxInclusive?: boolean;
    taxRuleId?: string;
  }> = [];

  const productsAll = await store.products.all();
  for (const line of lines) {
    if (!line || typeof line.productId !== "string" || !Number.isInteger(line.quantity) || line.quantity < 1) {
      errors.push({ productId: String(line?.productId ?? ""), reason: "Invalid line item." });
      continue;
    }
    const p = productsAll.find((x) => x.id === line.productId || x.slug === line.productId);
    if (!p) {
      errors.push({ productId: line.productId, reason: "Product not found." });
      continue;
    }
    if (!p.active) {
      errors.push({ productId: line.productId, reason: "Product is no longer available." });
      continue;
    }

    let unitPrice = p.price;
    let variantName = line.variantName;
    let sku = p.sku || p.slug;
    let availableStock = Number(p.stock || 0);

    if (line.variantId && Array.isArray(p.variants)) {
      const v = p.variants.find((x) => x.id === line.variantId);
      if (v && v.active !== false) {
        unitPrice = v.price;
        variantName = v.name;
        sku = v.sku || sku;
        availableStock = Number(v.stock || 0);
      }
    }

    if (availableStock < line.quantity && !p.preorderEnabled) {
      errors.push({ productId: line.productId, reason: `Insufficient stock. Available: ${availableStock}` });
      continue;
    }

    // use server-side price and tax parameters only — never trust client-sent prices
    const taxInfo = await resolveProductTax(p);
    resolvedLines.push({
      productId: p.slug,
      name: variantName ? `${p.name} (${variantName})` : p.name,
      variantId: line.variantId,
      variantName,
      sku,
      unitPrice,
      quantity: line.quantity,
      hsnCode: taxInfo.hsnCode,
      gstRate: taxInfo.gstRate,
      taxMode: taxInfo.taxMode,
      taxInclusive: taxInfo.taxInclusive,
      taxRuleId: taxInfo.ruleId,
    });
  }

  if (errors.length) { const msg=errors[0].reason.startsWith("Insufficient stock")?errors[0].reason:"Your bag needs attention. Please review the items."; return json({ error: msg, details: errors }, 422); }

  // payment & shipping method selection
  const paymentMethod = String(body?.paymentMethod || "cod").toLowerCase();
  const shippingMethod = String(body?.shippingMethod || "standard").toLowerCase();

  // coupon discount validation
  let couponDiscount = 0;
  const couponCode = body?.couponCode ? String(body.couponCode).trim().toUpperCase() : undefined;
  if (couponCode) {
    const coupon = await couponStore.byCode(couponCode);
    if (coupon && coupon.isActive) {
      const subForCoupon = resolvedLines.reduce((s, r) => s + r.unitPrice * r.quantity, 0);
      if (coupon.type === "percentage") {
        couponDiscount = Math.round((subForCoupon * Number(coupon.discount)) / 100);
      } else {
        couponDiscount = Math.min(subForCoupon, Number(coupon.discount));
      }
    }
  }

  // ─── DONATION VALIDATION ─────────────────────────────────────────────────
  const rawDonation = Number(body?.donationAmount || 0);
  let donationAmount = 0;
  if (rawDonation > 0) {
    const donationSetting = await settingStore.get("donation_config");
    const dcConfig = donationSetting?.value
      ? (typeof donationSetting.value === "string" ? JSON.parse(String(donationSetting.value)) : donationSetting.value)
      : { enabled: false };
    const dValidation = validateDonation(rawDonation, dcConfig);
    if (!dValidation.valid) {
      return json({ error: dValidation.error || "Invalid donation." }, 422);
    }
    donationAmount = dValidation.amount;
  }

  // ─── AUTHORITATIVE PRICING CALCULATION ────────────────────────────────────
  const breakdown = await calculateOrderPricing({
    lines: resolvedLines.map(r => ({
      productId: r.productId,
      name: r.name,
      sku: r.productId,
      unitPrice: r.unitPrice,
      quantity: r.quantity,
      hsnCode: r.hsnCode,
      gstRate: r.gstRate,
      taxMode: r.taxMode,
      taxInclusive: r.taxInclusive,
      taxRuleId: r.taxRuleId,
    })),
    shippingState: shipping.state, shippingMethod, couponDiscount,
    donationAmount, paymentMethod,
  });

  const total = breakdown.grandTotal;
  const invoiceNo = await generateInvoiceNumber();

  // Server-side payment-method enforcement: the chosen gateway must exist and
  // be enabled. COD additionally honours admin-configured min/max order values.
  const selectedGateway = await paymentGatewayStore.byProvider(paymentMethod);
  if (!selectedGateway || !selectedGateway.enabled) {
    return json(
      { error: paymentMethod === "cod" ? "Cash on Delivery is currently unavailable. Please choose a prepaid method." : "The selected payment method is currently unavailable. Please choose another." },
      422,
    );
  }
  if (paymentMethod === "cod") {
    const codMin = Number(selectedGateway.minOrderValue || 0);
    const codMax = Number(selectedGateway.maxOrderValue || 0);
    if (codMin > 0 && total < codMin) {
      return json({ error: `Cash on Delivery is available on orders of ₹${codMin.toLocaleString("en-IN")} or more.` }, 422);
    }
    if (codMax > 0 && total > codMax) {
      return json({ error: `Cash on Delivery is unavailable for orders above ₹${codMax.toLocaleString("en-IN")}. Please pay online.` }, 422);
    }
  }

  // duplicate prevention: same user + same cart + same total within 10 minutes
  const cartLines: CartLine[] = resolvedLines.map((r) => ({ productId: r.productId, quantity: r.quantity }));
  const duplicate = await store.orders.findRecentDuplicate(userId, lineKey(cartLines), total);
  if (duplicate) return json({ error: "This order was already placed just now. Please check your orders.", orderId: duplicate.id }, 409);

  // Atomically verify & reserve stock via authoritative inventoryService
  const reserveResult = await inventoryService.reserveStock(
    resolvedLines.map((r) => ({
      productId: r.productId,
      variantId: r.variantId,
      variantName: r.variantName,
      sku: r.sku,
      quantity: r.quantity,
      unitPrice: r.unitPrice,
    })),
    invoiceNo,
    userId
  );
  if (!reserveResult.success) {
    return json({ error: reserveResult.error || "Failed to reserve inventory for this order." }, 422);
  }

  // optional prescription details
  const prescriptionKey = typeof body?.prescriptionKey === "string" ? body.prescriptionKey.trim() : undefined;
  const prescriptionFilename = typeof body?.prescriptionFilename === "string" ? body.prescriptionFilename.trim() : undefined;

  // create order with server-validated total, canonical product slugs, and unit prices
  const orderLines = resolvedLines.map((r) => ({
    productId: r.productId,
    quantity: r.quantity,
    unitPrice: r.unitPrice,
    variantId: r.variantId,
    variantName: r.variantName,
    sku: r.sku,
  }));
  const order = await store.orders.create(userId, orderLines, total, shipping, {
    subtotal: breakdown.subtotal,
    discount: breakdown.totalDiscount,
    shippingFee: breakdown.shippingCharge + breakdown.shippingTax,
    couponCode,
    paymentMethod,
    paymentStatus: paymentMethod === "cod" ? "cod_pending" : "pending",
    prescriptionKey,
    prescriptionFilename,
    prescriptionStatus: prescriptionKey ? "submitted" : "not_submitted",
    donationAmount: breakdown.donationAmount,
    invoiceNo,
  });

  // ─── STORE INVOICE SNAPSHOT ──────────────────────────────────────────────
  // Snapshot pricing details so historical invoices never change.
  try {
    const invoiceSnapshot = {
      version: 3,
      orderId: order.id,
      invoiceNo,
      lines: breakdown.lines.map(l => ({
        productId: l.productId, name: l.name, sku: l.sku, hsnCode: l.hsnCode,
        quantity: l.quantity, unitPrice: l.unitPrice, discount: l.discount,
        taxableValue: l.taxableValue, gstRate: l.gstRate,
        cgst: l.cgst, sgst: l.sgst, igst: l.igst, gstTotal: l.gstTotal,
        lineTotal: l.lineTotal, taxTreatment: l.taxTreatment,
        taxMode: l.taxMode, taxInclusive: l.taxInclusive, taxRuleId: l.taxRuleId,
      })),
      subtotal: breakdown.subtotal,
      totalDiscount: breakdown.totalDiscount,
      taxableProductValue: breakdown.taxableProductValue,
      totalCgst: breakdown.totalCgst, totalSgst: breakdown.totalSgst,
      totalIgst: breakdown.totalIgst, totalGst: breakdown.totalGst,
      shippingCharge: breakdown.shippingCharge, shippingTax: breakdown.shippingTax,
      shippingMethod: breakdown.shippingMethod,
      codFee: breakdown.codFee,
      otherCharges: breakdown.otherCharges,
      totalOtherCharges: breakdown.totalOtherCharges,
      totalOtherChargesTax: breakdown.totalOtherChargesTax,
      donationAmount: breakdown.donationAmount, donationTax: breakdown.donationTax,
      donationTaxTreatment: breakdown.donationTaxTreatment,
      roundOff: breakdown.roundOff, grandTotal: breakdown.grandTotal,
      gstBreakdown: breakdown.gstBreakdown,
      amountInWords: breakdown.amountInWords,
      businessInfo: breakdown.businessInfo,
      invoiceConfig: breakdown.invoiceConfig,
      invoiceColumnsConfig: breakdown.invoiceColumnsConfig,
      invoiceTemplateConfig: breakdown.invoiceTemplateConfig,
      paymentMethod, shipping, couponCode,
      calculatedAt: breakdown.calculatedAt,
      createdAt: new Date().toISOString(),
    };
    await settingStore.set(`invoice_snapshot_${order.id}`, invoiceSnapshot, "invoices");
  } catch (e) {
    console.error("Invoice snapshot error (non-fatal):", e);
  }

  // Affiliate conversion attribution
  const cookieHeader = request.headers.get("cookie") || "";
  const matchRef = cookieHeader.match(/qc_affiliate_ref=([^;]+)/);
  const matchLink = cookieHeader.match(/qc_affiliate_link_id=([^;]+)/);
  const refCode = body?.affiliateRef || (matchRef ? decodeURIComponent(matchRef[1]) : null);
  const linkId = body?.affiliateLinkId || (matchLink ? decodeURIComponent(matchLink[1]) : undefined);

  if (refCode) {
    try {
      const resolved = await affiliateStore.byRef(refCode);
      if (resolved?.affiliate && resolved.affiliate.status === "active") {
        const rate = Number(resolved.affiliate.commissionRate || 10);
        const commissionAmount = Math.round((breakdown.subtotal * rate) / 100);
        if (commissionAmount > 0) {
          await affiliateStore.recordCommission(
            String(resolved.affiliate.id),
            String(order.id),
            commissionAmount,
            linkId || (resolved.link ? String(resolved.link.id) : undefined)
          );
        }
      }
    } catch (e) {
      console.error("Affiliate attribution error:", e);
    }
  }

  // Dispatch Order Confirmation & Operations Alerts (non-blocking)
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const itemSummary = resolvedLines.map((l) => `${l.name} (x${l.quantity})`).join(", ");

    // 1. Customer Omnichannel Notification (Email, SMS, WhatsApp)
    dispatchNotification({
      event: "order_placed",
      recipient: {
        name: shipping.fullName,
        email: shipping.email,
        phone: shipping.phone,
      },
      data: {
        customer_name: shipping.fullName,
        order_id: String(order.id),
        order_total: breakdown.grandTotal,
        payment_method: paymentMethod.toUpperCase(),
        item_summary: itemSummary,
        order_url: `${siteUrl}/account/orders`,
      },
      idempotencyKey: `order_placed_${order.id}`,
    }).catch((err) => console.error("Order placed notification error:", err));

    // 2. Operations Alert Email
    const opsEmail = process.env.OPERATIONS_EMAIL || "care@queenscare.in";
    emailService.send({
      templateId: "admin_order_alert",
      recipientEmail: opsEmail,
      recipientName: "Operations Team",
      data: {
        order_id: String(order.id),
        order_total: breakdown.grandTotal,
        customer_name: shipping.fullName,
        customer_city: `${shipping.city}, ${shipping.state}`,
        items_count: resolvedLines.length,
        admin_order_url: `${siteUrl}/admin`,
      },
      idempotencyKey: `admin_alert_${order.id}`,
    }).catch((err) => console.error("Admin order alert error:", err));
  } catch (e) {
    console.error("Non-fatal email dispatch error:", e);
  }

  return json({ order: { ...order, lines: resolvedLines, total, shipping, breakdown } }, 201);
}