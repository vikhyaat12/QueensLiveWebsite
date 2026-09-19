/**
 * Queens Care — Server-Side Pricing Engine
 * 
 * Single source of truth for ALL order money/tax calculations.
 * Used by: Checkout, Order API, Invoice, Admin, PDF.
 * 
 * Never trust frontend totals. Always recalculate server-side.
 */

import { settingStore, paymentGatewayStore } from "./store-extensions";
import { fileDb } from "./file-db";
import { amountInWords } from "./number-to-words";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type TaxTreatment = "taxable" | "non_taxable" | "exempt" | "zero_rated";

export interface TaxConfig {
  enabled: boolean;
  defaultRate: number;           // percentage e.g. 18
  taxInclusive: boolean;
  rounding: "nearest" | "up" | "down";
}

export interface BusinessInfo {
  legalName: string;
  tradeName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  pan: string;
  cin: string;
  logoUrl: string;
  logoHeight: number;
  logoAlignment: "left" | "center" | "right";
  supportPhone: string;
  supportEmail: string;
  invoiceFooter: string;
  invoiceNotes: string;
  termsAndConditions: string;
  returnsPolicy: string;
  authorizedSignatoryLabel: string;
  signatoryTitle: string;
  drugLicenseNo?: string;
  drugLicenseForm?: string;
  fssaiLicenseNo?: string;
  pharmacistName?: string;
  pharmacistRegNo?: string;
  grievanceOfficerName?: string;
  grievanceEmail?: string;
  grievancePhone?: string;
  warehouseAddress?: string;
  operatingAddress?: string;
  businessHours?: string;
}

export interface InvoiceConfig {
  title: string;
  subtitle: string;
  prefix: string;
  startingNumber: number;
  nextNumber: number;
  format: string;
  dateFormat: string;
  showInvoiceDate: boolean;
  showOrderNumber: boolean;
  showPaymentStatus: boolean;
  showPaymentMethod: boolean;
  showPlaceOfSupply: boolean;
  showStateCode: boolean;
  showReverseCharge: boolean;
}

export interface InvoiceColumnsConfig {
  showProductImage: boolean;
  showSku: boolean;
  showHsn: boolean;
  showQuantity: boolean;
  showUnitPrice: boolean;
  showDiscount: boolean;
  showTaxableValue: boolean;
  showGstRate: boolean;
  showCgst: boolean;
  showSgst: boolean;
  showIgst: boolean;
  showLineTotal: boolean;
}

export interface InvoiceTemplateConfig {
  templateStyle: "default_premium" | "detailed_gst" | "compact";
  primaryColor: string;
  accentColor: string;
  fontFamily: "system" | "serif" | "mono" | "sans";
  borderStyle: "elegant" | "minimal" | "boxed";
  showAmountInWords: boolean;
  showGstBreakupTable: boolean;
  showTerms: boolean;
  showSignature: boolean;
}

export interface GstBreakdownItem {
  hsnCode: string;
  taxableValue: number;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
}

export interface ShippingChargeConfig {
  enabled: boolean;
  defaultCharge: number;
  freeShippingThreshold: number;
  methods: ShippingMethod[];
}

export interface ShippingMethod {
  id: string;
  name: string;
  charge: number;
  enabled: boolean;
  taxTreatment: TaxTreatment;
  gstRate: number;
}

export interface OtherCharge {
  id: string;
  name: string;
  description: string;
  amount: number;
  type: "fixed" | "percentage";
  enabled: boolean;
  taxTreatment: TaxTreatment;
  gstRate: number;
  automaticallyApplied: boolean;
  sortOrder: number;
}

export interface DonationConfig {
  enabled: boolean;
  title: string;
  description: string;
  causeName: string;
  causeDescription: string;
  organizationName: string;
  presetAmounts: number[];
  customAmountEnabled: boolean;
  customMin: number;
  customMax: number;
  defaultAmount: number;
  displayPosition: string;
  label: string;
  thankYouMessage: string;
  taxTreatment: TaxTreatment;
  gstRate: number;
}

export interface ProductTaxInfo {
  productId: string;
  hsnCode: string;
  gstRate: number;
  taxCategory: string;
}

export interface LineInput {
  productId: string;
  name: string;
  sku?: string;
  unitPrice: number;    // MRP / base price before discount
  quantity: number;
  discount?: number;     // per-unit discount
  hsnCode?: string;
  gstRate?: number;      // product-specific override
  taxTreatment?: TaxTreatment;
  taxMode?: "taxable" | "exempt" | "zero_rated";
  taxInclusive?: boolean;
  taxRuleId?: string;
}

export interface LineCalculation {
  productId: string;
  name: string;
  sku: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxableValue: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstTotal: number;
  lineTotal: number;
  taxTreatment: TaxTreatment;
  taxMode?: "taxable" | "exempt" | "zero_rated";
  taxInclusive?: boolean;
  taxRuleId?: string;
}

export interface OtherChargeCalculation {
  id: string;
  name: string;
  amount: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  taxTreatment: TaxTreatment;
}

export interface OrderBreakdown {
  // Line items
  lines: LineCalculation[];
  
  // Subtotals
  subtotal: number;           // sum of unitPrice * quantity
  totalDiscount: number;      // sum of all line discounts
  
  // Taxable
  taxableProductValue: number;
  
  // Tax
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  isIntraState: boolean;
  
  // Shipping
  shippingCharge: number;
  shippingTax: number;
  shippingMethod: string;
  
  // COD
  codFee: number;
  
  // Other charges
  otherCharges: OtherChargeCalculation[];
  totalOtherCharges: number;
  totalOtherChargesTax: number;
  
  // Donation
  donationAmount: number;
  donationTax: number;
  donationTaxTreatment: TaxTreatment;
  
  // Rounding & Total
  roundOff: number;
  grandTotal: number;
  
  // Payment snapshot
  amountPaid: number;
  amountDue: number;
  
  // GST breakdown grouped by HSN code
  gstBreakdown: GstBreakdownItem[];
  amountInWords: string;
  invoiceColumnsConfig?: InvoiceColumnsConfig;
  invoiceTemplateConfig?: InvoiceTemplateConfig;
  
  // Metadata
  taxConfig: TaxConfig;
  businessInfo: BusinessInfo;
  invoiceConfig: InvoiceConfig;
  calculatedAt: string;
}

// ─── STATE DATA ───────────────────────────────────────────────────────────────

// Indian state codes for intra/inter state determination
const STATE_CODES: Record<string, string> = {
  "Andhra Pradesh": "37", "Arunachal Pradesh": "12", "Assam": "18",
  "Bihar": "10", "Chhattisgarh": "22", "Goa": "30", "Gujarat": "24",
  "Haryana": "06", "Himachal Pradesh": "02", "Jharkhand": "20",
  "Karnataka": "29", "Kerala": "32", "Madhya Pradesh": "23",
  "Maharashtra": "27", "Manipur": "14", "Meghalaya": "17",
  "Mizoram": "15", "Nagaland": "13", "Odisha": "21",
  "Punjab": "03", "Rajasthan": "08", "Sikkim": "11",
  "Tamil Nadu": "33", "Telangana": "36", "Tripura": "16",
  "Uttar Pradesh": "09", "Uttarakhand": "05", "West Bengal": "19",
  "Delhi": "07", "Chandigarh": "04", "Puducherry": "34",
  "Jammu & Kashmir": "01", "Ladakh": "38",
  "Andaman and Nicobar Islands": "35", "Dadra and Nagar Haveli and Daman and Diu": "26",
  "Lakshadweep": "31",
};

// ─── SETTINGS HELPERS ─────────────────────────────────────────────────────────

async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const s = await settingStore.get(key);
    if (s && s.value !== undefined && s.value !== null) {
      const v = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
      if (Array.isArray(defaultValue)) {
        return (Array.isArray(v) ? v : defaultValue) as T;
      }
      if (typeof defaultValue === "object" && defaultValue !== null) {
        return { ...defaultValue, ...(typeof v === "object" && v !== null ? v : {}) } as T;
      }
      return v as T;
    }
  } catch {}
  return defaultValue;
}

export async function getTaxConfig(): Promise<TaxConfig> {
  return getSetting("tax_config", {
    enabled: true,
    defaultRate: 18,
    taxInclusive: false,
    rounding: "nearest",
  });
}

export async function saveTaxConfig(patch: Partial<TaxConfig> & Record<string, unknown>): Promise<TaxConfig> {
  const current = await getTaxConfig();
  const updated = { ...current, ...patch };
  await settingStore.set("tax_config", updated, "tax");
  return updated as TaxConfig;
}

export async function getBusinessInfo(): Promise<BusinessInfo> {
  return getSetting("business_info", {
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
    termsAndConditions: "1. All goods sold are for personal healthcare or prescription-guided care.\n2. Goods once opened cannot be returned due to hygiene and pharmaceutical safety norms.\n3. Discrepancies must be reported within 48 hours of delivery.\n4. Disputes subject to Mumbai jurisdiction.",
    returnsPolicy: "Unopened sealed products may be returned within 7 days of delivery. Refer to queenscare.in/terms.",
    authorizedSignatoryLabel: "Authorized Signatory",
    signatoryTitle: "For QUEENS CARE LABORATORIES",
  });
}

export async function getInvoiceConfig(): Promise<InvoiceConfig> {
  return getSetting("invoice_config", {
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
}

export async function getInvoiceColumnsConfig(): Promise<InvoiceColumnsConfig> {
  return getSetting("invoice_columns_config", {
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
}

export async function getInvoiceTemplateConfig(): Promise<InvoiceTemplateConfig> {
  return getSetting("invoice_template_config", {
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
}

export async function getDonationConfig(): Promise<DonationConfig> {
  return getSetting("donation_config", {
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
}

export async function getOtherCharges(): Promise<OtherCharge[]> {
  const c = await getSetting("other_charges", []);
  return Array.isArray(c) ? c : [];
}

// ─── CALCULATION ENGINE ───────────────────────────────────────────────────────

function roundAmount(amount: number, method: TaxConfig["rounding"]): number {
  switch (method) {
    case "up": return Math.ceil(amount);
    case "down": return Math.floor(amount);
    case "nearest":
    default: return Math.round(amount);
  }
}

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Main calculation function.
 * All other paths (checkout preview, invoice, admin) should call this.
 */
export async function calculateOrderPricing(params: {
  lines: LineInput[];
  shippingState: string;
  shippingMethod?: string;
  couponDiscount?: number;
  donationAmount?: number;
  paymentMethod?: string;
  selectedOtherCharges?: string[];
  otherChargeAmounts?: Record<string, number>;
  shippingChargeOverride?: number;
  codFeeOverride?: number;
}): Promise<OrderBreakdown> {
  const {
    lines,
    shippingState,
    shippingMethod = "standard",
    couponDiscount = 0,
    donationAmount = 0,
    paymentMethod = "cod",
    selectedOtherCharges = [],
    otherChargeAmounts = {},
    shippingChargeOverride,
    codFeeOverride,
  } = params;

  const taxConfig = await getTaxConfig();
  const businessInfo = await getBusinessInfo();
  const invoiceConfig = await getInvoiceConfig();
  const donationConfig = await getDonationConfig();
  const rawOtherCharges = await getOtherCharges();
  const allOtherCharges = Array.isArray(rawOtherCharges) ? rawOtherCharges : [];
  const orderStateCode = STATE_CODES[shippingState] || "00";
  const isIntraState = orderStateCode === businessInfo.stateCode;

  // Precalculate subtotal for proportional coupon apportionment (GST Section 15 compliance)
  const rawSubtotal = lines.reduce((acc, l) => acc + safeNum(l.unitPrice) * Math.max(1, Math.floor(safeNum(l.quantity))), 0);
  const totalCoupon = Math.min(rawSubtotal, safeNum(couponDiscount));

  // ─── LINE CALCULATIONS ────────────────────────────────────────────────────
  const calcLines: LineCalculation[] = [];
  let subtotal = 0;
  let totalDiscount = 0;
  let taxableProductValue = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  for (const line of lines) {
    const qty = Math.max(1, Math.floor(safeNum(line.quantity)));
    const price = safeNum(line.unitPrice);
    const disc = safeNum(line.discount);

    // Tax mode: taxable, exempt, or zero_rated
    const taxMode = line.taxMode || (line.taxTreatment === "non_taxable" ? "exempt" : "taxable");
    const isExempt = taxMode === "exempt" || taxMode === "zero_rated";

    // GST rate: if exempt, rate is 0. Otherwise check line override or default
    const gstRate = isExempt
      ? 0
      : (line.gstRate !== undefined && line.gstRate !== null
          ? safeNum(line.gstRate)
          : (taxConfig.enabled ? safeNum(taxConfig.defaultRate) : 0));

    const hsnCode = line.hsnCode || "3004";
    const taxTreatment: TaxTreatment = isExempt || gstRate === 0
      ? (taxMode === "exempt" ? "exempt" : taxMode === "zero_rated" ? "zero_rated" : "non_taxable")
      : "taxable";

    // Check if price is tax inclusive (line override or global setting)
    const isInclusive = line.taxInclusive !== undefined
      ? Boolean(line.taxInclusive)
      : Boolean(taxConfig.taxInclusive);

    const lineSubtotal = price * qty;
    const lineItemDiscount = disc * qty;
    const lineCouponDiscount = rawSubtotal > 0 ? Math.round((lineSubtotal / rawSubtotal) * totalCoupon * 100) / 100 : 0;
    const lineDiscount = lineItemDiscount + lineCouponDiscount;
    const netLine = Math.max(0, lineSubtotal - lineDiscount);

    let lineTaxable = 0;
    let taxAmount = 0;
    let lineTotal = 0;

    if (isExempt || gstRate === 0) {
      lineTaxable = netLine;
      taxAmount = 0;
      lineTotal = netLine;
    } else if (isInclusive) {
      // GST-inclusive formula:
      // Taxable Value = Inclusive Price / (1 + GST Rate / 100)
      // GST Amount = Inclusive Price - Taxable Value
      // Customer pays inclusive price, GST is NOT added on top.
      const rateDecimal = gstRate / 100;
      lineTaxable = roundAmount(netLine / (1 + rateDecimal), taxConfig.rounding);
      taxAmount = roundAmount(netLine - lineTaxable, taxConfig.rounding);
      lineTotal = netLine;
    } else {
      // GST-exclusive formula:
      // Taxable Value = Net Price
      // GST Amount = Taxable Value * (GST Rate / 100)
      // Line Total = Taxable Value + GST Amount
      lineTaxable = netLine;
      taxAmount = roundAmount(lineTaxable * (gstRate / 100), taxConfig.rounding);
      lineTotal = lineTaxable + taxAmount;
    }

    let cgst = 0, sgst = 0, igst = 0;
    if (taxAmount > 0) {
      if (isIntraState) {
        cgst = Math.round((taxAmount / 2) * 100) / 100;
        sgst = Math.round((taxAmount - cgst) * 100) / 100;
        igst = 0;
      } else {
        cgst = 0;
        sgst = 0;
        igst = taxAmount;
      }
    }
    const gstTotal = Math.round((cgst + sgst + igst) * 100) / 100;

    subtotal += lineSubtotal;
    totalDiscount += lineDiscount;
    taxableProductValue += lineTaxable;
    totalCgst += cgst;
    totalSgst += sgst;
    totalIgst += igst;

    calcLines.push({
      productId: line.productId,
      name: line.name,
      sku: line.sku || line.productId,
      hsnCode,
      quantity: qty,
      unitPrice: price,
      discount: lineDiscount,
      taxableValue: lineTaxable,
      gstRate,
      cgst,
      sgst,
      igst,
      gstTotal,
      lineTotal,
      taxTreatment,
      taxMode,
      taxInclusive: isInclusive,
      taxRuleId: line.taxRuleId,
    });
  }

  const totalGst = totalCgst + totalSgst + totalIgst;

  // ─── COUPON DISCOUNT ──────────────────────────────────────────────────────
  // Coupon discount is apportioned proportionally across line items (GST Section 15 compliance)
  const appliedDiscount = totalCoupon;

  // ─── SHIPPING ─────────────────────────────────────────────────────────────
  const shippingRulesData = fileDb.findOne("shippingRules", (r: Record<string, unknown>) => r.active !== false);
  const freeThreshold = safeNum(shippingRulesData?.freeShippingThreshold) || 1500;
  const standardFee = safeNum(shippingRulesData?.standardShippingFee) || 99;
  const expressFee = safeNum(shippingRulesData?.expressShippingFee) || 199;
  
  const eligibleForFree = (subtotal - appliedDiscount) >= freeThreshold;
  let shippingCharge = 0;
  let shippingMethodLabel = "Standard Delivery";
  
  if (shippingChargeOverride !== undefined) {
    shippingCharge = safeNum(shippingChargeOverride);
    shippingMethodLabel = shippingCharge === 0 ? "Free Delivery" : "Delivery";
  } else if (shippingMethod === "free") {
    shippingCharge = 0;
    shippingMethodLabel = "Free Delivery";
  } else if (shippingMethod === "express") {
    shippingCharge = expressFee;
    shippingMethodLabel = "Express Delivery";
  } else if (!eligibleForFree && subtotal > 0) {
    shippingCharge = standardFee;
    shippingMethodLabel = "Standard Delivery";
  } else {
    shippingMethodLabel = eligibleForFree ? "Free Delivery" : "Standard Delivery";
  }

  // Shipping tax (if taxable — typically 18% GST on shipping)
  const shippingTaxRate = taxConfig.enabled ? 18 : 0;
  const shippingTax = shippingCharge > 0
    ? roundAmount(shippingCharge * shippingTaxRate / 100, taxConfig.rounding)
    : 0;

  // ─── OTHER CHARGES ────────────────────────────────────────────────────────
  const appliedCharges: OtherChargeCalculation[] = [];
  let totalOtherCharges = 0;
  let totalOtherChargesTax = 0;

  for (const charge of allOtherCharges) {
    if (!charge.enabled) continue;
    if (charge.automaticallyApplied || selectedOtherCharges.includes(charge.id)) {
      let chargeAmount = safeNum(otherChargeAmounts[charge.id]) || safeNum(charge.amount);
      if (charge.type === "percentage") {
        chargeAmount = roundAmount(subtotal * chargeAmount / 100, taxConfig.rounding);
      }
      const taxRate = taxConfig.enabled && charge.taxTreatment === "taxable" ? (charge.gstRate || taxConfig.defaultRate) : 0;
      const gstAmt = roundAmount(chargeAmount * taxRate / 100, taxConfig.rounding);
      
      appliedCharges.push({
        id: charge.id,
        name: charge.name,
        amount: chargeAmount,
        taxableAmount: charge.taxTreatment === "taxable" ? chargeAmount : 0,
        gstRate: taxRate,
        gstAmount: gstAmt,
        total: chargeAmount + gstAmt,
        taxTreatment: charge.taxTreatment,
      });
      totalOtherCharges += chargeAmount;
      totalOtherChargesTax += gstAmt;
    }
  }

  // ─── COD FEE ──────────────────────────────────────────────────────────────
  let codFee = 0;
  if (paymentMethod === "cod") {
    if (codFeeOverride !== undefined) {
      codFee = safeNum(codFeeOverride);
    } else {
      const codGatewayFee = safeNum((await paymentGatewayStore?.byProvider?.("cod"))?.codCharge);
      codFee = codGatewayFee || safeNum(shippingRulesData?.codHandlingFee) || 20;
    }
  } else {
    codFee = 0;
  }
  let donationFinal = 0;
  let donationTax = 0;
  let donationTaxTreatment: TaxTreatment = "non_taxable";
  
  if (donationConfig.enabled && donationAmount > 0) {
    donationFinal = safeNum(donationAmount);
    donationTaxTreatment = donationConfig.taxTreatment;
    if (donationTaxTreatment === "taxable" && taxConfig.enabled) {
      donationTax = roundAmount(donationFinal * (donationConfig.gstRate || taxConfig.defaultRate) / 100, taxConfig.rounding);
    }
  }

  // ─── GRAND TOTAL ──────────────────────────────────────────────────────────
  // Products net payable (incorporating line discounts and taxes where applicable)
  const productsNetPayable = calcLines.reduce((sum, l) => sum + l.lineTotal, 0);
  const productsAfterCoupon = productsNetPayable;

  const grandTotalBeforeRound = productsAfterCoupon + shippingCharge + shippingTax + codFee + totalOtherCharges + totalOtherChargesTax + donationFinal + donationTax;
  const grandTotal = roundAmount(grandTotalBeforeRound, taxConfig.rounding);
  const roundOff = Number((grandTotal - grandTotalBeforeRound).toFixed(2));

  // ─── GST BREAKDOWN SUMMARY (BY HSN/SAC) ──────────────────────────────────
  const hsnMap = new Map<string, GstBreakdownItem>();
  for (const line of calcLines) {
    if (line.taxTreatment !== "taxable" || line.taxableValue <= 0) continue;
    const hsn = line.hsnCode || "3004";
    const key = `${hsn}_${line.gstRate}`;
    const existing = hsnMap.get(key) || {
      hsnCode: hsn,
      taxableValue: 0,
      gstRate: line.gstRate,
      cgstRate: isIntraState ? line.gstRate / 2 : 0,
      cgstAmount: 0,
      sgstRate: isIntraState ? line.gstRate / 2 : 0,
      sgstAmount: 0,
      igstRate: !isIntraState ? line.gstRate : 0,
      igstAmount: 0,
      totalTax: 0,
    };
    existing.taxableValue += line.taxableValue;
    existing.cgstAmount += line.cgst;
    existing.sgstAmount += line.sgst;
    existing.igstAmount += line.igst;
    existing.totalTax += line.gstTotal;
    hsnMap.set(key, existing);
  }

  // Include taxable shipping if applicable
  if (shippingTax > 0) {
    const key = "9968_18";
    const existing = hsnMap.get(key) || {
      hsnCode: "9968",
      taxableValue: 0,
      gstRate: 18,
      cgstRate: isIntraState ? 9 : 0,
      cgstAmount: 0,
      sgstRate: isIntraState ? 9 : 0,
      sgstAmount: 0,
      igstRate: !isIntraState ? 18 : 0,
      igstAmount: 0,
      totalTax: 0,
    };
    existing.taxableValue += shippingCharge;
    if (isIntraState) {
      const cgst = Math.round(shippingTax / 2);
      existing.cgstAmount += cgst;
      existing.sgstAmount += (shippingTax - cgst);
    } else {
      existing.igstAmount += shippingTax;
    }
    existing.totalTax += shippingTax;
    hsnMap.set(key, existing);
  }

  const gstBreakdown = Array.from(hsnMap.values());
  const words = amountInWords(grandTotal);
  const invoiceColumnsConfig = await getInvoiceColumnsConfig();
  const invoiceTemplateConfig = await getInvoiceTemplateConfig();

  return {
    lines: calcLines,
    subtotal,
    totalDiscount,
    taxableProductValue,
    totalCgst,
    totalSgst,
    totalIgst,
    totalGst,
    isIntraState,
    shippingCharge,
    shippingTax,
    shippingMethod: shippingMethodLabel,
    codFee,
    otherCharges: appliedCharges,
    totalOtherCharges,
    totalOtherChargesTax,
    donationAmount: donationFinal,
    donationTax,
    donationTaxTreatment,
    roundOff,
    grandTotal,
    amountPaid: 0,
    amountDue: grandTotal,
    gstBreakdown,
    amountInWords: words,
    invoiceColumnsConfig,
    invoiceTemplateConfig,
    taxConfig,
    businessInfo,
    invoiceConfig,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Generate next invoice number using the configured format.
 */
export async function generateInvoiceNumber(): Promise<string> {
  const config = await getInvoiceConfig();
  const num = config.nextNumber || config.startingNumber || 1001;
  const now = new Date();
  const year = now.getFullYear();
  const nextYearShort = (year % 100) + 1;
  const formattedNum = String(num).padStart(5, "0");

  let invoiceNo = `${config.prefix || "QC-INV-"}${year}-${nextYearShort}/${formattedNum}`;
  if (config.format && config.format.includes("{number")) {
    invoiceNo = config.format
      .replace(/\{year\}/g, String(year))
      .replace(/\{nextYear\}/g, String(nextYearShort))
      .replace(/\{number(?::(\d+))?\}/, (_, pad) => String(num).padStart(pad ? parseInt(pad, 10) : 5, "0"));
  }
  
  // Increment counter
  await settingStore.set("invoice_config", {
    ...config,
    nextNumber: num + 1,
  }, "billing");

  return invoiceNo;
}

/**
 * Validate donation amount against admin config.
 * Returns sanitized amount or error.
 */
export function validateDonation(amount: unknown, config: DonationConfig): { valid: boolean; amount: number; error?: string } {
  const a = Number(amount);
  if (!Number.isFinite(a) || a < 0) {
    return { valid: false, amount: 0, error: "Invalid donation amount." };
  }
  if (a === 0) return { valid: true, amount: 0 };
  // Only reject NON-ZERO donations when the feature is disabled
  if (!config.enabled) {
    return { valid: false, amount: 0, error: "Donation feature is not available." };
  }
  if (!config.customAmountEnabled && !config.presetAmounts.includes(a)) {
    return { valid: false, amount: 0, error: "Please select a valid preset amount." };
  }
  if (config.customAmountEnabled) {
    if (a < config.customMin) {
      return { valid: false, amount: 0, error: `Minimum donation is ₹${config.customMin}.` };
    }
    if (a > config.customMax) {
      return { valid: false, amount: 0, error: `Maximum donation is ₹${config.customMax.toLocaleString("en-IN")}.` };
    }
  }
  return { valid: true, amount: Math.round(a) };
}

export { STATE_CODES, getSetting };
