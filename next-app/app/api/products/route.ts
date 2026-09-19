import { json, requireUser, safeText } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET(request: Request) {
  const products = await store.products.all();
  const url = new URL(request.url);
  // Admin requests with ?all=true see everything; public listings filter
  if (url.searchParams.get('all') === 'true') {
    return json({ products });
  }
  const visibleProducts = products.filter((p: Record<string, unknown>) => {
    if (p.active === false) return false;
    if (p.visible === false) return false;
    if (p.status === 'hidden') return false;
    return true;
  });
  return json({ products: visibleProducts });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const b = await request.json().catch(() => null);
  const name = safeText(b?.name, 120);
  const slug = safeText(b?.slug, 120).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const price = Number(b?.price), stock = Number(b?.stock);
  if (!name || !slug || !Number.isInteger(price) || price < 0 || !Number.isInteger(stock) || stock < 0)
    return json({ error: "Invalid product details." }, 422);
  const product = await store.products.save({
    name, slug,
    description: safeText(b?.description, 2000),
    shortDescription: safeText(b?.shortDescription, 500),
    category: safeText(b?.category, 80) || "General",
    brand: safeText(b?.brand, 80) || "Queens Care",
    price, mrp: b?.mrp ? Number(b.mrp) : undefined,
    discount: b?.discount ? Number(b.discount) : undefined,
    stock,
    lowStockThreshold: b?.lowStockThreshold ? Number(b.lowStockThreshold) : 10,
    image: safeText(b?.image, 500),
    thumbnail: safeText(b?.thumbnail, 500),
    video: safeText(b?.video, 500),
    active: b?.active !== false,
    visible: b?.visible !== false,
    featured: !!b?.featured,
    homepageVisible: !!b?.homepageVisible,
    benefits: Array.isArray(b?.benefits) ? b.benefits : undefined,
    ingredients: safeText(b?.ingredients, 2000),
    usage: safeText(b?.usage, 2000),
    safetyInfo: safeText(b?.safetyInfo, 1000),
    tags: safeText(b?.tags, 500),
    searchKeywords: safeText(b?.searchKeywords, 500),
    seoTitle: safeText(b?.seoTitle, 200),
    seoDescription: safeText(b?.seoDescription, 500),
    taxRate: typeof b?.taxRate === "number" ? b.taxRate : undefined,
    gstRate: typeof b?.gstRate === "number" ? b.gstRate : undefined,
    taxMode: b?.taxMode || undefined,
    taxInclusive: b?.taxInclusive !== undefined ? Boolean(b.taxInclusive) : undefined,
    taxRuleId: b?.taxRuleId ? String(b.taxRuleId) : undefined,
    hsnCode: safeText(b?.hsnCode, 20) || undefined,
    taxCategory: safeText(b?.taxCategory, 20) || undefined,
    // Pharmaceutical & Clinical
    genericName: safeText(b?.genericName, 150) || undefined,
    composition: safeText(b?.composition, 250) || undefined,
    strength: safeText(b?.strength, 100) || undefined,
    dosageForm: safeText(b?.dosageForm, 100) || undefined,
    packSize: safeText(b?.packSize, 100) || undefined,
    manufacturer: safeText(b?.manufacturer, 150) || undefined,
    marketer: safeText(b?.marketer, 150) || undefined,
    prescriptionStatus: b?.prescriptionStatus || undefined,
    storageConditions: safeText(b?.storageConditions, 200) || undefined,
    warnings: safeText(b?.warnings, 500) || undefined,
    batchNo: safeText(b?.batchNo, 80) || undefined,
    expiryDate: safeText(b?.expiryDate, 40) || undefined,
    // Inventory & Pre-order
    sku: safeText(b?.sku, 80) || undefined,
    trackInventory: b?.trackInventory !== undefined ? Boolean(b.trackInventory) : true,
    inventoryMessagingEnabled: b?.inventoryMessagingEnabled !== undefined ? Boolean(b.inventoryMessagingEnabled) : true,
    scarcityThreshold: b?.scarcityThreshold !== undefined ? Number(b.scarcityThreshold) : 5,
    minPurchaseQty: b?.minPurchaseQty !== undefined ? Number(b.minPurchaseQty) : 1,
    maxPurchaseQty: b?.maxPurchaseQty !== undefined ? Number(b.maxPurchaseQty) : 10,
    preorderEnabled: b?.preorderEnabled !== undefined ? Boolean(b.preorderEnabled) : false,
    preorderLabel: safeText(b?.preorderLabel, 80) || undefined,
    preorderMessage: safeText(b?.preorderMessage, 250) || undefined,
    expectedDispatchDate: safeText(b?.expectedDispatchDate, 50) || undefined,
    preorderMaxQty: b?.preorderMaxQty !== undefined ? Number(b.preorderMaxQty) : undefined,
    preorderCodAllowed: b?.preorderCodAllowed !== undefined ? Boolean(b.preorderCodAllowed) : false,
    costPrice: b?.costPrice !== undefined ? Number(b.costPrice) : undefined,
    outOfStockMessage: safeText(b?.outOfStockMessage, 200) || undefined,
    status: b?.status || (b?.active !== false ? "active" : "inactive"),
    // Highlights & Bullets
    highlights: Array.isArray(b?.highlights) ? b.highlights : undefined,
    // Variants
    variants: Array.isArray(b?.variants) ? b.variants : undefined,
    // Specifications & Media
    specifications: b?.specifications || undefined,
    images: Array.isArray(b?.images) ? b.images : undefined,
    videos: Array.isArray(b?.videos) ? b.videos : undefined,
    modelUrl: safeText(b?.modelUrl, 500) || undefined,
    // A+ Content
    aplusContent: b?.aplusContent || undefined,
    aplusTemplateId: b?.aplusTemplateId || undefined,
    aplusPublished: b?.aplusPublished !== undefined ? Boolean(b.aplusPublished) : undefined,
    // Shipping
    weightGrams: b?.weightGrams !== undefined ? Number(b.weightGrams) : undefined,
    dimensions: b?.dimensions || undefined,
    coldChainRequired: b?.coldChainRequired !== undefined ? Boolean(b.coldChainRequired) : undefined,
    // Cross-sell & Admin
    relatedProductIds: Array.isArray(b?.relatedProductIds) ? b.relatedProductIds : undefined,
    frequentlyBoughtTogetherIds: Array.isArray(b?.frequentlyBoughtTogetherIds) ? b.frequentlyBoughtTogetherIds : undefined,
    adminNotes: safeText(b?.adminNotes, 1000) || undefined,
  });
  return json({ product }, 201);
}
