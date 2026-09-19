export type Role = "customer" | "admin" | "distributor" | "doctor" | "employee" | "affiliate" | "b2b_pending" | "b2b_approved";
export type OrderStatus = "pending" | "paid" | "processing" | "packed" | "shipped" | "delivered" | "cancelled" | "returned" | "refunded";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded" | "cod_pending";
export type B2BStatus = "pending" | "approved" | "declined" | "suspended";
export type AffiliateStatus = "pending" | "active" | "suspended" | "rejected";
export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";
export type MediaType = "image" | "video" | "model_3d" | "document";

export type Product = {
  id: string; slug: string; name: string; brand?: string; description: string;
  shortDescription?: string; category: string; subcategory?: string;
  price: number; mrp?: number; discount?: number; stock: number;
  lowStockThreshold?: number; image: string; images?: string[]; thumbnail?: string; video?: string;
  videos?: Array<{ id?: string; url: string; title?: string; posterUrl?: string }>;
  modelUrl?: string; specifications?: ProductSpec[] | Record<string, unknown>[] | string;
  active: boolean; visible?: boolean; featured?: boolean; homepageVisible?: boolean;
  bestSeller?: boolean; newArrival?: boolean;
  // Pharmaceutical & Clinical Model
  genericName?: string; composition?: string; strength?: string; dosageForm?: string;
  packSize?: string; manufacturer?: string; marketer?: string;
  prescriptionStatus?: "none" | "rx_required" | "rx_optional";
  storageConditions?: string; warnings?: string; batchNo?: string; expiryDate?: string;
  benefits?: string[]; ingredients?: string; usage?: string; safetyInfo?: string;
  tags?: string; searchKeywords?: string; seoTitle?: string; seoDescription?: string;
  seoOgImage?: string; altText?: string; taxRate?: number; hsnCode?: string; gstRate?: number; taxCategory?: string;
  taxMode?: "taxable" | "exempt" | "zero_rated"; taxInclusive?: boolean; taxRuleId?: string;
  // Product Highlights / Bullets
  highlights?: Array<{ id: string; text: string; icon?: string; active?: boolean }> | string[];
  // Variants
  variants?: ProductVariant[];
  // Inventory Management & Pre-order
  sku?: string;
  trackInventory?: boolean;
  inventoryMessagingEnabled?: boolean;
  scarcityThreshold?: number;
  maxPurchaseQty?: number;
  minPurchaseQty?: number;
  preorderEnabled?: boolean;
  preorderLabel?: string;
  preorderMessage?: string;
  expectedDispatchDate?: string;
  preorderMaxQty?: number;
  preorderCodAllowed?: boolean;
  costPrice?: number;
  outOfStockMessage?: string;
  status?: string;
  // Shipping & Logistics
  weightGrams?: number;
  dimensions?: { length?: number; width?: number; height?: number; unit?: string };
  coldChainRequired?: boolean;
  // Merchandising & Cross-Sell
  relatedProductIds?: string[];
  frequentlyBoughtTogetherIds?: string[];
  adminNotes?: string;
  // A+ Content
  aplusContent?: Array<Record<string, unknown>> | string;
  aplusTemplateId?: string | null;
  aplusPublished?: boolean;
  rating?: number; reviewCount?: number; createdAt: string; updatedAt?: string;
};

export type CartLine = {
  productId: string;
  quantity: number;
  variantId?: string;
  variantName?: string;
  sku?: string;
  unitPrice?: number;
};

export type InventoryMovementType =
  | "ORDER"
  | "RESERVATION"
  | "RELEASE"
  | "CANCELLATION"
  | "RETURN"
  | "REFUND"
  | "MANUAL_INCREASE"
  | "MANUAL_DECREASE"
  | "STOCK_CORRECTION"
  | "DAMAGED"
  | "EXPIRED"
  | "QUARANTINE"
  | "SAMPLE"
  | "RESTOCK"
  | "OTHER";

export type InventoryTransaction = {
  id: string;
  productId: string;
  productName?: string;
  variantId?: string;
  variantName?: string;
  sku?: string;
  type: InventoryMovementType;
  quantity: number;
  qtyBefore: number;
  qtyAfter: number;
  reason: string;
  orderId?: string;
  actor: string;
  notes?: string;
  createdAt: string;
};

export type BackInStockSubscription = {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantId?: string;
  email: string;
  phone?: string;
  status: "pending" | "notified" | "cancelled";
  createdAt: string;
  notifiedAt?: string;
};
export type UserStatus = "active" | "disabled" | "deactivated";
export type User = { id: string; email: string; name: string; role: Role; createdAt: string; phone?: string; avatar?: string; permissions?: string[]; status?: UserStatus; isActive?: boolean; tokenVersion?: number; };
export type AuthUser = User & { passwordHash: string; };
export type ShippingDetails = { fullName: string; email: string; phone: string; address: string; city: string; state: string; pincode: string };
export type Order = {
  id: string; userId: string; status: OrderStatus; paymentStatus?: PaymentStatus;
  paymentMethod?: string; paymentId?: string; subtotal: number; discount?: number;
  couponCode?: string; shippingFee?: number; tax?: number; total: number;
  trackingCode?: string; shipping?: ShippingDetails | Json; notes?: string;
  prescriptionKey?: string; prescriptionFilename?: string; prescriptionStatus?: string; prescriptionNotes?: string;
  prescriptionReviewedAt?: string; prescriptionReviewedBy?: string;
  lines: CartLine[]; createdAt: string; updatedAt?: string;
};
export type BlogPost = {
  id: string; slug: string; title: string; excerpt: string; body: string;
  content?: string; category?: string; tags?: string; author?: string;
  readTime?: string; image?: string; images?: string; videoUrl?: string;
  videoTitle?: string; featured?: boolean;
  seoTitle?: string; seoDescription?: string; ogImage?: string;
  published: boolean; visible?: boolean;
  createdAt: string; updatedAt?: string;
};
export type SiteContent = { key: string; value: unknown; updatedAt: string };
export type ContactMessage = { id: string; name: string; email: string; subject: string; message: string; createdAt: string; };
export type B2BApplication = {
  id: string; company: string; name: string; email: string; phone?: string;
  type: string; message?: string; status: B2BStatus; reviewedBy?: string;
  reviewedAt?: string; notes?: string; createdAt: string;
};
export type Review = { id: string; productId: string; userId: string; rating: number; title: string; body: string; images?: string; videoUrl?: string; verified?: boolean; visible?: boolean; helpful?: number; createdAt: string; };
export type ProductVariant = { id: string; productId: string; name: string; sku?: string; price: number; mrp?: number; stock: number; image?: string; active: boolean; sort: number; };
export type ProductSpec = { id: string; productId: string; name: string; value: string; sort: number; };
export type ProductVideo = { id: string; productId: string; title?: string; url: string; posterUrl?: string; description?: string; sort: number; active: boolean; };
export type ProductAPlusSection = { id: string; productId: string; type: string; title?: string; heading?: string; body?: string; imageUrl?: string; imageAlt?: string; content?: Record<string, unknown>; sort: number; active: boolean; };
export type ProductQA = { id: string; productId: string; userId?: string; question: string; answer?: string; answeredBy?: string; visible: boolean; createdAt: string; };
export type ProductImage = { id: string; productId: string; url: string; alt?: string; sort: number; };
export type Employee = { id: string; name: string; employeeId?: string; designation?: string; department?: string; photo?: string; phone?: string; email?: string; bio?: string; slug: string; active: boolean; };
export type Doctor = { id: string; name: string; email: string; phone?: string; clinic?: string; specialty?: string; qualification?: string; regNumber?: string; status: string; };
export type Notification = { id: string; userId: string; title: string; body: string; type?: string; read: boolean; createdAt: string; };
export type Address = { id: string; userId: string; label: string; fullName: string; phone: string; address: string; city: string; state: string; pincode: string; isDefault: boolean; };
export type Coupon = {
  id: string; code: string; type: string; discount: number; minOrder: number;
  maxDiscount?: number; startDate?: string; expiryDate?: string;
  usageLimit?: number; usedCount: number; perUserLimit: number; isActive: boolean;
  createdAt: string;
};
export type Affiliate = {
  id: string; userId: string; affiliateCode: string; status: AffiliateStatus;
  commissionRate: number; level: number; totalSales: number;
  totalCommission: number; pendingCommission: number; approvedCommission: number;
  withdrawnCommission: number; wallet: number; customCoupon?: string;
  createdAt: string;
};
export type Distributor = {
  id: string; userId?: string; company: string; contactName: string;
  email: string; phone?: string; address?: string; city?: string; state?: string;
  gstNumber?: string; status: B2BStatus; pricingTier?: string;
  creditLimit: number; createdAt: string;
};
export type Media = {
  id: string; filename: string; type: MediaType; url: string;
  mimeType?: string; size?: number; alt?: string; title?: string;
  usedBy?: string; visible: boolean; createdAt: string;
};
export type Banner = {
  id: string; title: string; subtitle?: string; imageUrl: string;
  linkUrl?: string; position: string; sort: number; active: boolean;
  visible: boolean; startDate?: string; endDate?: string;
};
export type FAQ = { id: string; question: string; answer: string; category?: string; sort: number; visible: boolean; };
export type Testimonial = { id: string; name: string; title?: string; body: string; rating?: number; image?: string; visible: boolean; sort: number; };
export type Setting = { key: string; value: unknown; group: string; };
export type SiteSettings = { siteTitle?: string; siteDescription?: string; ogTitle?: string; ogDescription?: string; ogImage?: string; primaryColor?: string; accentColor?: string; [key: string]: unknown; };
export type Offer = { id: string; title: string; description?: string; type: string; discount?: number; imageUrl?: string; linkUrl?: string; active: boolean; visible: boolean; };
// Keep Json alias for backward compat
type Json = Record<string, unknown>;

export interface SearchFacetItem {
  name: string;
  count: number;
}

export interface SearchProductResult {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  mrp?: number;
  discount?: number;
  category: string;
  stock: number;
  description?: string;
  scarcityMessage?: string;
  inStock: boolean;
  isPreorder: boolean;
  prescriptionRequired?: boolean;
  rating?: number;
  reviewCount?: number;
  score: number;
  variantCount?: number;
  highlights?: string[];
}

export interface SearchQueryOptions {
  q: string;
  type?: "suggest" | "full";
  category?: string;
  inStockOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "relevance" | "price_asc" | "price_desc" | "rating_desc" | "newest";
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  query: string;
  correctedQuery?: string;
  results: SearchProductResult[];
  totalCount: number;
  suggestions: string[];
  categoryFacets: SearchFacetItem[];
  priceBounds: { min: number; max: number };
  page: number;
  totalPages: number;
  hasMore: boolean;
}
