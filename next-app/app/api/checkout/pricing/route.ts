import { json } from "@/lib/http";
import { calculateOrderPricing, validateDonation, getSetting } from "@/lib/commerce/pricing-engine";
import { store } from "@/lib/commerce/store";
import { couponStore } from "@/lib/commerce/store-extensions";
import { resolveProductTax } from "@/lib/commerce/tax-rules";

// POST: Preview pricing breakdown (used by checkout before placing order)
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.lines || !Array.isArray(body.lines) || body.lines.length === 0) {
    return json({ error: "No items provided." }, 422);
  }

  const { lines, shippingState, shippingMethod, couponCode, donationAmount, paymentMethod } = body;

  if (!shippingState || typeof shippingState !== "string") {
    return json({ error: "Shipping state is required." }, 422);
  }

  // Validate donation server-side
  const donationConfig = await getSetting<Record<string, unknown>>("donation_config", {});
  const donationValidation = validateDonation(donationAmount || 0, {
    ...donationConfig,
    enabled: Boolean(donationConfig.enabled),
    presetAmounts: Array.isArray(donationConfig.presetAmounts) ? donationConfig.presetAmounts as number[] : [],
    customAmountEnabled: Boolean(donationConfig.customAmountEnabled),
    customMin: Number(donationConfig.customMin) || 0,
    customMax: Number(donationConfig.customMax) || 0,
    taxTreatment: donationConfig.taxTreatment === "taxable" ? "taxable" : "non_taxable",
    gstRate: Number(donationConfig.gstRate) || 0,
  } as Parameters<typeof validateDonation>[1]);
  if (!donationValidation.valid) {
    return json({ error: donationValidation.error }, 422);
  }

  try {
    const productsAll = await store.products.all().catch(() => []);
    const resolvedLines = await Promise.all(
      lines.map(async (l: Record<string, unknown>) => {
        const idOrSlug = String(l.productId || l.slug || l.id || "");
        const p = productsAll.find((x) => x.id === idOrSlug || x.slug === idOrSlug);
        if (p) {
          const taxInfo = await resolveProductTax(p);
          return {
            productId: p.slug,
            name: p.name,
            sku: p.slug,
            unitPrice: p.price,
            quantity: Number(l.quantity || 1),
            hsnCode: taxInfo.hsnCode,
            gstRate: taxInfo.gstRate,
            taxMode: taxInfo.taxMode,
            taxInclusive: taxInfo.taxInclusive,
            taxRuleId: taxInfo.ruleId,
          };
        }
        return {
          productId: idOrSlug,
          name: String(l.name || idOrSlug),
          sku: String(l.sku || idOrSlug),
          unitPrice: Number(l.unitPrice || l.price || 0),
          quantity: Number(l.quantity || 1),
          hsnCode: l.hsnCode ? String(l.hsnCode) : undefined,
          gstRate: typeof l.gstRate === "number" ? l.gstRate : undefined,
          taxMode: (l.taxMode as "taxable" | "exempt" | "zero_rated") || undefined,
          taxInclusive: typeof l.taxInclusive === "boolean" ? l.taxInclusive : undefined,
          taxRuleId: l.taxRuleId ? String(l.taxRuleId) : undefined,
        };
      })
    );

    // Calculate coupon discount if couponCode is provided
    let couponDiscount = 0;
    if (couponCode && typeof couponCode === "string") {
      try {
        const coupon = await couponStore.byCode(couponCode.trim().toUpperCase());
        if (coupon && coupon.isActive) {
          const sub = resolvedLines.reduce((s, r) => s + r.unitPrice * r.quantity, 0);
          if (coupon.type === "percentage") {
            couponDiscount = Math.round((sub * Number(coupon.discount)) / 100);
          } else {
            couponDiscount = Math.min(sub, Number(coupon.discount));
          }
        }
      } catch (err) {
        console.warn("Coupon lookup non-fatal error:", err);
      }
    }

    const breakdown = await calculateOrderPricing({
      lines: resolvedLines,
      shippingState,
      shippingMethod: shippingMethod || "standard",
      couponDiscount,
      donationAmount: donationValidation.amount,
      paymentMethod: paymentMethod || "cod",
    });

    return json({ breakdown });
  } catch (err) {
    console.error("Pricing calculation error:", err);
    return json({ error: "Failed to calculate pricing." }, 500);
  }
}

// GET: Fetch donation config (public, for checkout UI)
export async function GET() {
  const donationConfig = await getSetting("donation_config", {
    enabled: false, title: "", description: "", causeName: "",
    causeDescription: "", organizationName: "",
    presetAmounts: [10, 25, 50, 100, 250, 500],
    customAmountEnabled: true, customMin: 10, customMax: 10000,
    defaultAmount: 0, displayPosition: "before_payment",
    label: "Donation / Contribution", thankYouMessage: "",
    taxTreatment: "non_taxable", gstRate: 0,
  });
  return json({ donation: donationConfig });
}
