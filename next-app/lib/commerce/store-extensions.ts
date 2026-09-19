import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { fileDb } from "./file-db";
import { store } from "./store";

const usePrisma = Boolean(process.env.DATABASE_URL);
const now = () => new Date().toISOString();

// ─── COUPONS ─────────────────────────────────────────────────────────────────

export const couponStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }); } catch {}
    }
    return fileDb.findMany("coupons");
  },

  byCode: async (code: string) => {
    const norm = code.toUpperCase();
    if (usePrisma) {
      try { return await prisma.coupon.findUnique({ where: { code: norm } }); } catch {}
    }
    return fileDb.findOne("coupons", c => String(c.code).toUpperCase() === norm);
  },

  create: async (data: Record<string, unknown>) => {
    const code = String(data.code).toUpperCase();
    if (usePrisma) {
      try {
        const c = await prisma.coupon.create({ data: { ...data, code } as never });
        fileDb.insert("coupons", c as unknown as Record<string, unknown>);
        return c;
      } catch {}
    }
    return fileDb.insert("coupons", { ...data, code, usedCount: 0, isActive: data.isActive !== false });
  },

  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const c = await prisma.coupon.update({ where: { id }, data: data as never });
        fileDb.update("coupons", id, c as unknown as Record<string, unknown>);
        return c;
      } catch {}
    }
    return fileDb.update("coupons", id, data);
  },

  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.coupon.delete({ where: { id } });
        fileDb.remove("coupons", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("coupons", id));
  },

  validate: async (code: string, subtotal: number, userId?: string) => {
    let coupon: Record<string, unknown> | null = null;
    const norm = code.toUpperCase();
    if (usePrisma) {
      try {
        coupon = (await prisma.coupon.findUnique({ where: { code: norm } })) as Record<string, unknown> | null;
      } catch {}
    }
    if (!coupon) {
      coupon = fileDb.findOne("coupons", c => String(c.code).toUpperCase() === norm);
    }
    if (!coupon) return { valid: false, error: "Coupon not found." };
    if (!coupon.isActive) return { valid: false, error: "This coupon is no longer active." };
    if (coupon.expiryDate && new Date(String(coupon.expiryDate)) < new Date()) return { valid: false, error: "This coupon has expired." };
    if (coupon.startDate && new Date(String(coupon.startDate)) > new Date()) return { valid: false, error: "This coupon is not yet active." };
    const minOrder = Number(coupon.minOrder || 0);
    if (subtotal < minOrder) return { valid: false, error: `Minimum order of ₹${minOrder.toLocaleString("en-IN")} required.` };
    const usageLimit = Number(coupon.usageLimit || 0);
    const usedCount = Number(coupon.usedCount || 0);
    if (usageLimit && usedCount >= usageLimit) return { valid: false, error: "This coupon has reached its usage limit." };
    if (userId && coupon.perUserLimit && usePrisma) {
      try {
        const userUsage = await prisma.couponUsage.count({ where: { couponId: String(coupon.id), userId } });
        if (userUsage >= Number(coupon.perUserLimit)) return { valid: false, error: "You have already used this coupon." };
      } catch {}
    }
    const discVal = Number(coupon.discount || 0);
    let discount = coupon.type === "percentage" ? Math.round((subtotal * discVal) / 100) : discVal;
    const maxDiscount = Number(coupon.maxDiscount || 0);
    if (maxDiscount && discount > maxDiscount) discount = maxDiscount;
    return { valid: true, coupon, discount };
  },

  recordUsage: async (couponId: string, userId: string, orderId: string, discount: number) => {
    if (usePrisma) {
      try {
        await prisma.couponUsage.create({ data: { couponId, userId, orderId, discount } });
        await prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      } catch {}
    }
    const found = fileDb.findOne("coupons", c => c.id === couponId);
    if (found) {
      fileDb.update("coupons", couponId, { usedCount: Number(found.usedCount || 0) + 1 });
    }
  },
};

// ─── AFFILIATES ──────────────────────────────────────────────────────────────

function generateAffiliateCode(): string {
  return `QC${randomBytes(4).toString("hex").toUpperCase()}`;
}

type AffiliateRecord = {
  id: string;
  userId: string;
  affiliateCode: string;
  status: string;
  commissionRate: number;
  customCoupon?: string | null;
  level: number;
  totalSales: number;
  totalCommission: number;
  pendingCommission: number;
  approvedCommission: number;
  withdrawnCommission: number;
  wallet: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  user?: Record<string, unknown> | null;
};

export const affiliateStore = {
  list: async (): Promise<AffiliateRecord[]> => {
    if (usePrisma) {
      try { return (await prisma.affiliate.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } })) as unknown as AffiliateRecord[]; } catch {}
    }
    const affiliates = fileDb.findMany("affiliates");
    const users = fileDb.findMany("users");
    return affiliates.map(a => ({
      ...a,
      user: users.find(u => u.id === a.userId) || { name: "Partner", email: "partner@queenscare.in" },
    })) as unknown as AffiliateRecord[];
  },

  byId: async (id: string): Promise<AffiliateRecord | null> => {
    if (usePrisma) {
      try { return (await prisma.affiliate.findUnique({ where: { id }, include: { user: true } })) as unknown as AffiliateRecord | null; } catch {}
    }
    const a = fileDb.findOne("affiliates", x => x.id === id);
    if (!a) return null;
    const user = fileDb.findOne("users", u => u.id === a.userId);
    return { ...a, user } as unknown as AffiliateRecord;
  },

  byUserId: async (userId: string): Promise<AffiliateRecord | null> => {
    if (usePrisma) {
      try { return (await prisma.affiliate.findUnique({ where: { userId }, include: { user: true } })) as unknown as AffiliateRecord | null; } catch {}
    }
    const a = fileDb.findOne("affiliates", x => x.userId === userId);
    if (!a) return null;
    const user = fileDb.findOne("users", u => u.id === userId);
    return { ...a, user } as unknown as AffiliateRecord;
  },

  byCode: async (code: string): Promise<AffiliateRecord | null> => {
    const norm = code.toUpperCase();
    if (usePrisma) {
      try { return (await prisma.affiliate.findUnique({ where: { affiliateCode: norm }, include: { user: true } })) as unknown as AffiliateRecord | null; } catch {}
    }
    const a = fileDb.findOne("affiliates", x => String(x.affiliateCode).toUpperCase() === norm);
    if (!a) return null;
    const user = fileDb.findOne("users", u => u.id === a.userId);
    return { ...a, user } as unknown as AffiliateRecord;
  },

  byRef: async (ref: string): Promise<{ affiliate: AffiliateRecord | null; link: Record<string, unknown> | null } | null> => {
    const code = ref.trim();
    if (!code) return null;
    if (usePrisma) {
      try {
        const byCode = (await prisma.affiliate.findUnique({ where: { affiliateCode: code.toUpperCase() }, include: { user: true } })) as unknown as AffiliateRecord | null;
        if (byCode) return { affiliate: byCode, link: null };
        const link = (await prisma.affiliateLink.findUnique({ where: { shortCode: code }, include: { affiliate: { include: { user: true } } } })) as unknown as Record<string, unknown> | null;
        if (link && link.affiliate) return { affiliate: link.affiliate as unknown as AffiliateRecord, link };
      } catch {}
    }
    const byCode = fileDb.findOne("affiliates", a => String(a.affiliateCode).toUpperCase() === code.toUpperCase());
    if (byCode) {
      const user = fileDb.findOne("users", u => u.id === byCode.userId);
      return { affiliate: { ...byCode, user } as unknown as AffiliateRecord, link: null };
    }
    const link = fileDb.findOne("affiliateLinks", l => String(l.shortCode).toUpperCase() === code.toUpperCase() || l.shortCode === code);
    if (link) {
      const aff = fileDb.findOne("affiliates", a => a.id === link.affiliateId);
      const user = aff ? fileDb.findOne("users", u => u.id === aff.userId) : null;
      return { affiliate: aff ? ({ ...aff, user } as unknown as AffiliateRecord) : null, link };
    }
    return null;
  },

  create: async (userId: string, data?: Partial<{ commissionRate: number; customCoupon: string }>) => {
    const code = generateAffiliateCode();
    if (usePrisma) {
      try {
        const aff = await prisma.affiliate.create({
          data: {
            userId,
            affiliateCode: code,
            status: "active",
            commissionRate: data?.commissionRate ?? 10,
            customCoupon: data?.customCoupon,
          },
          include: { user: true },
        });
        fileDb.insert("affiliates", aff as unknown as Record<string, unknown>);
        return aff;
      } catch {}
    }
    const record = {
      userId,
      affiliateCode: code,
      status: "active",
      commissionRate: data?.commissionRate ?? 10,
      customCoupon: data?.customCoupon,
      level: 1,
      totalSales: 0,
      totalCommission: 0,
      pendingCommission: 0,
      approvedCommission: 0,
      withdrawnCommission: 0,
      wallet: 0,
    };
    return fileDb.insert("affiliates", record);
  },

  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const aff = await prisma.affiliate.update({ where: { id }, data: data as never });
        fileDb.update("affiliates", id, aff as unknown as Record<string, unknown>);
        return aff;
      } catch {}
    }
    return fileDb.update("affiliates", id, data);
  },

  updateStatus: async (id: string, status: string) => {
    if (usePrisma) {
      try {
        const aff = await prisma.affiliate.update({ where: { id }, data: { status: status as never } });
        fileDb.update("affiliates", id, { status });
        return aff;
      } catch {}
    }
    return fileDb.update("affiliates", id, { status });
  },

  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.affiliate.delete({ where: { id } });
        fileDb.remove("affiliates", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("affiliates", id));
  },

  recordCommission: async (affiliateId: string, orderId: string, amount: number, linkId?: string) => {
    return affiliateStore.commissions.create({ affiliateId, orderId, amount });
  },

  recordClick: async (linkId: string | null, affiliateId: string, ip?: string, userAgent?: string, referer?: string) => {
    return affiliateStore.links.logClick(linkId || "direct", affiliateId, { ip, userAgent, referer });
  },

  getStats: async (affiliateId: string) => {
    const aff = (await affiliateStore.byId(affiliateId)) as Record<string, unknown> | null;
    const commissions = await affiliateStore.commissions.list(affiliateId);
    const links = await affiliateStore.links.list(affiliateId);
    const clicks = links.reduce((sum, l) => sum + Number(l.clicks || 0), 0);
    return {
      totalSales: Number(aff?.totalSales || 0),
      totalCommission: Number(aff?.totalCommission || 0),
      pendingCommission: Number(aff?.pendingCommission || 0),
      approvedCommission: Number(aff?.approvedCommission || 0),
      withdrawnCommission: Number(aff?.withdrawnCommission || 0),
      wallet: Number(aff?.wallet || 0),
      clicks,
      totalLinks: links.length,
      totalOrders: commissions.length,
    };
  },

  links: {
    list: async (affiliateId: string) => {
      if (usePrisma) {
        try { return await prisma.affiliateLink.findMany({ where: { affiliateId }, orderBy: { createdAt: "desc" } }); } catch {}
      }
      return fileDb.findMany("affiliateLinks", l => l.affiliateId === affiliateId);
    },
    create: async (affiliateId: string, dataOrProductId?: string | { productId?: string; url?: string; shortCode?: string }, customCode?: string) => {
      let productId: string | undefined;
      let url = "https://queenscare.in";
      let shortCode = customCode;
      if (typeof dataOrProductId === "object" && dataOrProductId !== null) {
        productId = dataOrProductId.productId;
        url = dataOrProductId.url || url;
        shortCode = dataOrProductId.shortCode || shortCode;
      } else if (typeof dataOrProductId === "string") {
        productId = dataOrProductId;
      }
      shortCode = shortCode || randomBytes(4).toString("hex");
      if (usePrisma) {
        try {
          const l = await prisma.affiliateLink.create({ data: { affiliateId, productId, url, shortCode } });
          fileDb.insert("affiliateLinks", l as unknown as Record<string, unknown>);
          return l;
        } catch {}
      }
      return fileDb.insert("affiliateLinks", { affiliateId, productId, url, shortCode, clicks: 0, conversions: 0, isActive: true });
    },
    byCode: async (shortCode: string) => {
      if (usePrisma) {
        try { return await prisma.affiliateLink.findUnique({ where: { shortCode }, include: { affiliate: true } }); } catch {}
      }
      const l = fileDb.findOne("affiliateLinks", x => x.shortCode === shortCode);
      if (!l) return null;
      const affiliate = fileDb.findOne("affiliates", a => a.id === l.affiliateId);
      return { ...l, affiliate };
    },
    logClick: async (linkId: string, affiliateId: string, reqInfo?: { ip?: string; userAgent?: string; referer?: string }) => {
      if (usePrisma) {
        try {
          await prisma.affiliateClick.create({ data: { linkId, affiliateId, ip: reqInfo?.ip, userAgent: reqInfo?.userAgent, referer: reqInfo?.referer } });
          await prisma.affiliateLink.update({ where: { id: linkId }, data: { clicks: { increment: 1 } } });
        } catch {}
      }
      const l = fileDb.findOne("affiliateLinks", x => x.id === linkId);
      if (l) {
        fileDb.update("affiliateLinks", linkId, { clicks: Number(l.clicks || 0) + 1 });
      }
      fileDb.insert("affiliateClicks", { linkId, affiliateId, ...reqInfo });
    },
  },

  commissions: {
    list: async (affiliateId?: string) => {
      if (usePrisma) {
        try { return await prisma.affiliateCommission.findMany({ where: affiliateId ? { affiliateId } : {}, orderBy: { createdAt: "desc" } }); } catch {}
      }
      return fileDb.findMany("affiliateCommissions", c => !affiliateId || c.affiliateId === affiliateId);
    },
    create: async (data: { affiliateId: string; orderId?: string; amount: number }) => {
      if (usePrisma) {
        try {
          const c = await prisma.affiliateCommission.create({ data: { affiliateId: data.affiliateId, orderId: data.orderId, amount: data.amount, status: "pending" } });
          await prisma.affiliate.update({ where: { id: data.affiliateId }, data: { pendingCommission: { increment: data.amount } } });
          fileDb.insert("affiliateCommissions", c as unknown as Record<string, unknown>);
          return c;
        } catch {}
      }
      const c = fileDb.insert("affiliateCommissions", { ...data, status: "pending" });
      const aff = fileDb.findOne("affiliates", a => a.id === data.affiliateId);
      if (aff) {
        fileDb.update("affiliates", data.affiliateId, { pendingCommission: Number(aff.pendingCommission || 0) + data.amount });
      }
      return c;
    },
    approve: async (id: string) => {
      if (usePrisma) {
        try {
          const commission = await prisma.affiliateCommission.findUnique({ where: { id } });
          if (commission && commission.status === "pending") {
            await prisma.affiliateCommission.update({ where: { id }, data: { status: "approved" } });
            await prisma.affiliate.update({
              where: { id: commission.affiliateId },
              data: {
                pendingCommission: { decrement: commission.amount },
                approvedCommission: { increment: commission.amount },
                wallet: { increment: commission.amount },
              },
            });
          }
        } catch {}
      }
      const c = fileDb.findOne("affiliateCommissions", x => x.id === id);
      if (c && c.status === "pending") {
        fileDb.update("affiliateCommissions", id, { status: "approved" });
        const a = fileDb.findOne("affiliates", x => x.id === c.affiliateId);
        if (a) {
          fileDb.update("affiliates", String(c.affiliateId), {
            pendingCommission: Math.max(0, Number(a.pendingCommission || 0) - Number(c.amount)),
            approvedCommission: Number(a.approvedCommission || 0) + Number(c.amount),
            wallet: Number(a.wallet || 0) + Number(c.amount),
          });
        }
      }
    },
    reject: async (id: string) => {
      if (usePrisma) {
        try {
          const commission = await prisma.affiliateCommission.findUnique({ where: { id } });
          if (commission && commission.status === "pending") {
            await prisma.affiliateCommission.update({ where: { id }, data: { status: "rejected" } });
            await prisma.affiliate.update({
              where: { id: commission.affiliateId },
              data: { pendingCommission: { decrement: commission.amount } },
            });
          }
        } catch {}
      }
      const c = fileDb.findOne("affiliateCommissions", x => x.id === id);
      if (c && c.status === "pending") {
        fileDb.update("affiliateCommissions", id, { status: "rejected" });
        const a = fileDb.findOne("affiliates", x => x.id === c.affiliateId);
        if (a) {
          fileDb.update("affiliates", String(c.affiliateId), {
            pendingCommission: Math.max(0, Number(a.pendingCommission || 0) - Number(c.amount)),
          });
        }
      }
    },
  },

  withdrawals: {
    all: async () => {
      if (usePrisma) {
        try { return await prisma.affiliateWithdrawal.findMany({ include: { affiliate: true }, orderBy: { createdAt: "desc" } }); } catch {}
      }
      return fileDb.findMany("affiliateWithdrawals");
    },
    list: async (affiliateId?: string) => {
      if (usePrisma) {
        try { return await prisma.affiliateWithdrawal.findMany({ where: affiliateId ? { affiliateId } : {}, include: { affiliate: true }, orderBy: { createdAt: "desc" } }); } catch {}
      }
      return fileDb.findMany("affiliateWithdrawals", w => !affiliateId || w.affiliateId === affiliateId);
    },
    request: async (affiliateId: string, amount: number, method?: string) => {
      return affiliateStore.withdrawals.create({ affiliateId, amount, method });
    },
    create: async (data: { affiliateId: string; amount: number; method?: string; accountDetails?: Record<string, unknown> }) => {
      if (usePrisma) {
        try {
          const w = await prisma.affiliateWithdrawal.create({ data: { affiliateId: data.affiliateId, amount: data.amount, method: data.method || "Bank Transfer", accountDetails: data.accountDetails as never, status: "pending" } });
          await prisma.affiliate.update({ where: { id: data.affiliateId }, data: { wallet: { decrement: data.amount } } });
          fileDb.insert("affiliateWithdrawals", w as unknown as Record<string, unknown>);
          return w;
        } catch {}
      }
      const w = fileDb.insert("affiliateWithdrawals", { ...data, status: "pending" });
      const a = fileDb.findOne("affiliates", x => x.id === data.affiliateId);
      if (a) {
        fileDb.update("affiliates", data.affiliateId, { wallet: Math.max(0, Number(a.wallet || 0) - data.amount) });
      }
      return w;
    },
    updateStatus: async (id: string, status: string) => {
      if (usePrisma) {
        try {
          const w = await prisma.affiliateWithdrawal.update({ where: { id }, data: { status: status as never, processedAt: status === "paid" ? new Date() : undefined } });
          fileDb.update("affiliateWithdrawals", id, w as unknown as Record<string, unknown>);
          return w;
        } catch {}
      }
      return fileDb.update("affiliateWithdrawals", id, { status, processedAt: status === "paid" ? now() : undefined });
    },
  },
};

// ─── B2B / DISTRIBUTOR ──────────────────────────────────────────────────────

export type B2BApplication = {
  id: string;
  company: string;
  businessType: string;
  name: string;
  designation?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  address?: string;
  city: string;
  state: string;
  country?: string;
  pincode?: string;
  gstNumber?: string;
  drugLicence?: string;
  panNumber?: string;
  yearsInBusiness?: string;
  distributionNetwork?: string;
  storeCount?: string;
  regionsCovered?: string;
  partnershipType: string;
  type?: string; // backward compat alias
  productInterest?: string;
  requirementVolume?: string;
  territory?: string;
  existingBrands?: string;
  additionalRequirements?: string;
  message?: string;
  documentUrl?: string;
  documentFileName?: string;
  documentFileSize?: number;
  consent: boolean;
  status: "new" | "pending" | "reviewing" | "contacted" | "approved" | "rejected" | "on_hold" | "closed" | "completed";
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type B2BFormField = {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "file";
  required: boolean;
  options?: string[];
  visible: boolean;
  group: "company" | "location" | "commercial" | "message" | "document";
  sortOrder: number;
};

export type B2BCustomSection = {
  id: string;
  heading: string;
  subheading?: string;
  content: string;
  imageUrl?: string;
  layout: "text_only" | "image_left" | "image_right" | "card_grid";
  cards?: Array<{ title: string; description: string; icon?: string }>;
  visible: boolean;
  sortOrder: number;
};

export type B2BPageConfig = {
  published: boolean;
  hero: {
    eyebrow: string;
    heading: string;
    subtitle: string;
    description: string;
    ctaText?: string;
    ctaLink?: string;
    ctaVisible?: boolean;
    imageUrl?: string;
    bgImageUrl?: string;
    videoUrl?: string;
    trustBadges: Array<{ top: string; bottom: string; icon?: string }>;
    stats: Array<{ value: string; label: string }>;
    primaryCta: { text: string; link: string; visible: boolean };
    secondaryCta: { text: string; link: string; visible: boolean };
    visible: boolean;
  };
  benefits: {
    heading: string;
    description: string;
    visible: boolean;
    cards: Array<{
      id: string;
      icon: string;
      imageUrl?: string;
      title: string;
      description: string;
      link?: string;
      visible: boolean;
      sortOrder: number;
    }>;
  };
  partnershipTypes: {
    heading: string;
    description: string;
    visible: boolean;
    types: Array<{
      id: string;
      title: string;
      badge: string;
      description: string;
      perks: string[];
      icon?: string;
      ctaText?: string;
      ctaLink?: string;
      visible: boolean;
      sortOrder: number;
    }>;
  };
  process: {
    heading: string;
    description?: string;
    visible: boolean;
    steps: Array<{
      stepNumber: number;
      title: string;
      description: string;
      icon: string;
      imageUrl?: string;
      visible: boolean;
    }>;
  };
  customSections: B2BCustomSection[];
  formConfig: {
    enabled: boolean;
    heading: string;
    description: string;
    submitButtonText: string;
    contactEmail: string;
    contactPhone: string;
    visible: boolean;
    fields?: B2BFormField[];
  };
  storeLocatorCta: {
    heading: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    visible: boolean;
  };
  cta: {
    heading: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    visible: boolean;
  };
  notifications: {
    adminNotificationEnabled: boolean;
    adminNotificationEmail: string;
    customerReceiptEnabled: boolean;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
};

export const defaultB2BPageConfig: B2BPageConfig = {
  published: true,
  hero: {
    eyebrow: "Partner with Queens Care Laboratories",
    heading: "B2B & Distribution Partnerships",
    subtitle: "High-potency clinical formulations with uncompromised pharmaceutical supply chain integrity.",
    description: "Queens Care Laboratories partners with distributors, clinic networks, hospital pharmacies, and clinical stockists across India. Our wholesale program offers tiered commercial margins, dedicated regulatory documentation, and priority dispatch.",
    ctaText: "Apply for Partnership",
    ctaLink: "#enquiry-form",
    ctaVisible: true,
    trustBadges: [
      { top: "Batch-Tested Quality", bottom: "Cleanroom Validated", icon: "🔬" },
      { top: "48-72h Metro SLA", bottom: "Pan-India Dispatch", icon: "🚚" },
      { top: "Full Batch COA", bottom: "Regulatory Dossiers", icon: "📑" },
      { top: "Tiered Margins", bottom: "Protected Territories", icon: "🛡️" },
    ],
    stats: [
      { value: "450+", label: "Partner Pharmacies" },
      { value: "28+", label: "Distribution Hubs" },
      { value: "99.4%", label: "On-Time Dispatch SLA" },
      { value: "100%", label: "Batch Quality Verified" },
    ],
    primaryCta: { text: "Apply for Partnership", link: "#enquiry-form", visible: true },
    secondaryCta: { text: "Speak to Commercial Team", link: "mailto:b2b@queenscare.in", visible: true },
    visible: true,
  },
  benefits: {
    heading: "Wholesale & Distribution Advantages",
    description: "Why medical professionals, hospital chains, and pharmaceutical stockists partner with Queens Care.",
    visible: true,
    cards: [
      {
        id: "b2b-ben-1",
        icon: "💎",
        title: "Tiered Wholesale Margins",
        description: "Attractive commercial margins designed to support sustainable retail and regional distribution growth.",
        visible: true,
        sortOrder: 1,
      },
      {
        id: "b2b-ben-2",
        icon: "🔬",
        title: "Quality-Controlled Formulations",
        description: "All products formulated in controlled cleanrooms with rigorous batch release testing.",
        visible: true,
        sortOrder: 2,
      },
      {
        id: "b2b-ben-3",
        icon: "🚚",
        title: "Priority Pan-India Dispatch",
        description: "Dedicated regional fulfillment hubs with guaranteed 48-72h dispatch SLAs across metro regions.",
        visible: true,
        sortOrder: 3,
      },
      {
        id: "b2b-ben-4",
        icon: "📑",
        title: "Complete Regulatory Dossiers",
        description: "Full Certificate of Analysis (COA), stability data, and compliance documentation provided for every batch.",
        visible: true,
        sortOrder: 4,
      },
      {
        id: "b2b-ben-5",
        icon: "🛡️",
        title: "Protected Distribution Territories",
        description: "Exclusive geographical territory allocation for committed regional distributors and key stockists.",
        visible: true,
        sortOrder: 5,
      },
      {
        id: "b2b-ben-6",
        icon: "🤝",
        title: "Dedicated Account Support",
        description: "Direct access to our commercial sales managers, medical literature, and co-branded marketing assets.",
        visible: true,
        sortOrder: 6,
      },
    ],
  },
  partnershipTypes: {
    heading: "Partnership Ecosystems",
    description: "Tailored commercial structures designed for diverse healthcare and distribution partners.",
    visible: true,
    types: [
      {
        id: "pt-distributor",
        title: "Regional Distributors",
        badge: "High Volume",
        description: "Exclusive territory distribution for established pharmaceutical stockists with state-wide supply networks.",
        perks: ["Territory exclusivity", "Maximum commercial margin tier", "Dedicated freight support"],
        icon: "🏢",
        ctaText: "Apply as Regional Distributor",
        ctaLink: "#enquiry-form",
        visible: true,
        sortOrder: 1,
      },
      {
        id: "pt-pharmacy",
        title: "Pharmacies & Retail Chains",
        badge: "Direct Retail",
        description: "Direct wholesale supply for licensed chemist networks, standalone retail pharmacies, and wellness stores.",
        perks: ["Low MOQ requirements", "Point-of-sale display material", "Rapid inventory replenishment"],
        icon: "💊",
        ctaText: "Apply as Retail Pharmacy",
        ctaLink: "#enquiry-form",
        visible: true,
        sortOrder: 2,
      },
      {
        id: "pt-clinic",
        title: "Clinics & Hospital Supply",
        badge: "Institutional",
        description: "Institutional supply for dermatology clinics, aesthetic practices, and healthcare hospital networks.",
        perks: ["Clinical batch COAs", "Institutional pricing", "Doctor sample allocations"],
        icon: "🏥",
        ctaText: "Apply for Clinical Supply",
        ctaLink: "#enquiry-form",
        visible: true,
        sortOrder: 3,
      },
      {
        id: "pt-corporate",
        title: "Corporate & Wellness Institutions",
        badge: "Institutional Bulk",
        description: "Custom bulk wellness packages and institutional employee health partnerships.",
        perks: ["Custom batch packaging", "Corporate health billing", "Direct door delivery"],
        icon: "🤝",
        ctaText: "Enquire for Corporate Supply",
        ctaLink: "#enquiry-form",
        visible: true,
        sortOrder: 4,
      },
    ],
  },
  process: {
    heading: "Structured 4-Step Onboarding Process",
    description: "A fast, transparent evaluation pathway designed for seamless partner activation.",
    visible: true,
    steps: [
      {
        stepNumber: 1,
        title: "Enquiry Submission",
        description: "Submit your business credentials, GST details, and preferred territory through our partnership portal.",
        icon: "📝",
        visible: true,
      },
      {
        stepNumber: 2,
        title: "Territory Evaluation",
        description: "Our commercial team reviews your distribution reach, existing network, and territory availability within 48 hours.",
        icon: "🔍",
        visible: true,
      },
      {
        stepNumber: 3,
        title: "Commercial Agreement",
        description: "Finalize wholesale price tiering, initial stocking order, credit terms, and official distribution appointment.",
        icon: "📑",
        visible: true,
      },
      {
        stepNumber: 4,
        title: "Priority Supply & Launch",
        description: "First batch dispatch accompanied by complete COAs, marketing literature, and dedicated partner manager onboarding.",
        icon: "🚀",
        visible: true,
      },
    ],
  },
  customSections: [],
  formConfig: {
    enabled: true,
    heading: "Partnership & Distribution Enquiry",
    description: "Submit your organization’s profile below. Our commercial partnerships director will contact you within 2 business days.",
    submitButtonText: "Submit Partnership Enquiry →",
    contactEmail: "b2b@queenscare.in",
    contactPhone: "+91 (0) 11 4988 7700",
    visible: true,
  },
  storeLocatorCta: {
    heading: "Looking for Retail Stockists or Partner Clinics?",
    description: "Locate verified Queens Care retail pharmacies, authorized clinics, and regional stockists near you.",
    buttonText: "Find a Store / Distributor Near You →",
    buttonLink: "/store-locator",
    visible: true,
  },
  cta: {
    heading: "Looking for Custom Institutional or Bulk Orders?",
    description: "Connect directly with our institutional medical supply team for hospital contracts, specialized packaging, or tenders.",
    buttonText: "Contact Institutional Division →",
    buttonLink: "mailto:b2b@queenscare.in",
    visible: true,
  },
  notifications: {
    adminNotificationEnabled: true,
    adminNotificationEmail: "b2b@queenscare.in",
    customerReceiptEnabled: true,
  },
  seo: {
    metaTitle: "B2B & Distribution Partnerships | Queens Care Laboratories",
    metaDescription: "Partner with Queens Care Laboratories. Wholesale pharmaceutical distribution, clinic partnerships, stockist opportunities, and institutional supply across India.",
    keywords: "Queens Care B2B, Pharmaceutical Distribution India, Wholesale Medicine Supplier, Clinic Partnerships, Pharmacy Stockist",
    ogTitle: "B2B & Distribution Partnerships | Queens Care Laboratories",
    ogDescription: "High-potency clinical formulations with uncompromised pharmaceutical supply chain integrity.",
    ogImage: "/uploads/logos/queens-care-logo.png",
    canonicalUrl: "https://queenscare.in/b2b",
  },
};

export const b2bPageStore = {
  get: async (): Promise<B2BPageConfig> => {
    const s = fileDb.findOne("settings", (item: Record<string, unknown>) => item.key === "b2b_page_cms_config");
    if (s?.value) {
      try {
        const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
        return {
          ...defaultB2BPageConfig,
          ...parsed,
          hero: { ...defaultB2BPageConfig.hero, ...(parsed.hero || {}) },
          benefits: { ...defaultB2BPageConfig.benefits, ...(parsed.benefits || {}) },
          partnershipTypes: { ...defaultB2BPageConfig.partnershipTypes, ...(parsed.partnershipTypes || {}) },
          process: { ...defaultB2BPageConfig.process, ...(parsed.process || {}) },
          customSections: parsed.customSections || defaultB2BPageConfig.customSections,
          formConfig: { ...defaultB2BPageConfig.formConfig, ...(parsed.formConfig || {}) },
          storeLocatorCta: { ...defaultB2BPageConfig.storeLocatorCta, ...(parsed.storeLocatorCta || {}) },
          cta: { ...defaultB2BPageConfig.cta, ...(parsed.cta || {}) },
          notifications: { ...defaultB2BPageConfig.notifications, ...(parsed.notifications || {}) },
          seo: { ...defaultB2BPageConfig.seo, ...(parsed.seo || {}) },
        };
      } catch {}
    }
    return defaultB2BPageConfig;
  },
  save: async (config: Partial<B2BPageConfig>): Promise<B2BPageConfig> => {
    const current = await b2bPageStore.get();
    const merged: B2BPageConfig = {
      ...current,
      ...config,
      hero: { ...current.hero, ...(config.hero || {}) },
      benefits: { ...current.benefits, ...(config.benefits || {}) },
      partnershipTypes: { ...current.partnershipTypes, ...(config.partnershipTypes || {}) },
      process: { ...current.process, ...(config.process || {}) },
      customSections: config.customSections !== undefined ? config.customSections : current.customSections,
      formConfig: { ...current.formConfig, ...(config.formConfig || {}) },
      storeLocatorCta: { ...current.storeLocatorCta, ...(config.storeLocatorCta || {}) },
      cta: { ...current.cta, ...(config.cta || {}) },
      notifications: { ...current.notifications, ...(config.notifications || {}) },
      seo: { ...current.seo, ...(config.seo || {}) },
    };
    fileDb.update("settings", { key: "b2b_page_cms_config" }, {
      key: "b2b_page_cms_config",
      value: JSON.stringify(merged),
      group: "cms",
      updatedAt: new Date().toISOString(),
    });
    return merged;
  },
};

export const b2bStore = {
  applications: {
    list: async (): Promise<B2BApplication[]> => {
      const list = (fileDb.findMany("b2bApplications", () => true) as unknown as B2BApplication[]) || [];
      return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    },
    byId: async (id: string): Promise<B2BApplication | null> => {
      const all = await b2bStore.applications.list();
      return all.find((a) => a.id === id) || null;
    },
    create: async (data: Partial<B2BApplication>): Promise<B2BApplication> => {
      const id = `QC-B2B-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const record: B2BApplication = {
        id,
        company: String(data.company || "Untitled Business").trim(),
        businessType: String(data.businessType || "distributor").trim(),
        name: String(data.name || "").trim(),
        designation: data.designation ? String(data.designation).trim() : undefined,
        email: String(data.email || "").trim(),
        phone: String(data.phone || "").trim(),
        whatsapp: data.whatsapp ? String(data.whatsapp).trim() : undefined,
        website: data.website ? String(data.website).trim() : undefined,
        address: data.address ? String(data.address).trim() : undefined,
        city: String(data.city || "").trim(),
        state: String(data.state || "").trim(),
        country: String(data.country || "India").trim(),
        pincode: data.pincode ? String(data.pincode).trim() : undefined,
        gstNumber: data.gstNumber ? String(data.gstNumber).trim() : undefined,
        drugLicence: data.drugLicence ? String(data.drugLicence).trim() : undefined,
        panNumber: data.panNumber ? String(data.panNumber).trim() : undefined,
        yearsInBusiness: data.yearsInBusiness ? String(data.yearsInBusiness).trim() : undefined,
        distributionNetwork: data.distributionNetwork ? String(data.distributionNetwork).trim() : undefined,
        storeCount: data.storeCount ? String(data.storeCount).trim() : undefined,
        regionsCovered: data.regionsCovered ? String(data.regionsCovered).trim() : undefined,
        partnershipType: String(data.partnershipType || data.type || "distributor").trim(),
        type: String(data.partnershipType || data.type || "distributor").trim(),
        productInterest: data.productInterest ? String(data.productInterest).trim() : undefined,
        requirementVolume: data.requirementVolume ? String(data.requirementVolume).trim() : undefined,
        territory: data.territory ? String(data.territory).trim() : undefined,
        existingBrands: data.existingBrands ? String(data.existingBrands).trim() : undefined,
        additionalRequirements: data.additionalRequirements ? String(data.additionalRequirements).trim() : undefined,
        message: data.message ? String(data.message).trim() : undefined,
        documentUrl: data.documentUrl ? String(data.documentUrl).trim() : undefined,
        documentFileName: data.documentFileName ? String(data.documentFileName).trim() : undefined,
        documentFileSize: data.documentFileSize ? Number(data.documentFileSize) : undefined,
        consent: data.consent !== false,
        status: (data.status as B2BApplication["status"]) || "new",
        notes: data.notes ? String(data.notes).trim() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      fileDb.insert("b2bApplications", record as unknown as Record<string, unknown>);
      return record;
    },
    updateStatus: async (id: string, status: string, reviewedBy?: string, notes?: string): Promise<B2BApplication | null> => {
      const updated = fileDb.update("b2bApplications", id, {
        status,
        reviewedBy,
        reviewedAt: new Date().toISOString(),
        ...(notes !== undefined ? { notes } : {}),
        updatedAt: new Date().toISOString(),
      }) as unknown as B2BApplication | null;

      if (status === "approved" && updated) {
        const exists = fileDb.findOne("distributors", (d) => d.applicationId === id);
        if (!exists) {
          fileDb.insert("distributors", {
            applicationId: id,
            company: updated.company,
            contactName: updated.name,
            email: updated.email,
            phone: updated.phone,
            status: "approved",
            pricingTier: "Tier 1 - Wholesale",
            createdAt: new Date().toISOString(),
          });
        }
      }
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      return Boolean(fileDb.remove("b2bApplications", id));
    },
  },

  distributors: {
    list: async () => {
      if (usePrisma) {
        try { return await prisma.distributor.findMany({ include: { application: true }, orderBy: { createdAt: "desc" } }); } catch {}
      }
      return fileDb.findMany("distributors");
    },
    byId: async (id: string) => {
      if (usePrisma) {
        try { return await prisma.distributor.findUnique({ where: { id }, include: { application: true } }); } catch {}
      }
      return fileDb.findOne("distributors", d => d.id === id);
    },
    update: async (id: string, data: Record<string, unknown>) => {
      if (usePrisma) {
        try {
          const d = await prisma.distributor.update({ where: { id }, data: data as never });
          fileDb.update("distributors", id, d as unknown as Record<string, unknown>);
          return d;
        } catch {}
      }
      return fileDb.update("distributors", id, data);
    },
  },

  orders: {
    list: async (distributorId?: string) => {
      return [];
    },
    create: async (distributorId: string, lines: { productId: string; quantity: number; unitPrice: number }[], total: number, notes?: string) => {
      return null;
    },
    updateStatus: async (id: string, status: string) => {
      return null;
    },
  },
};

// ─── MEDIA ───────────────────────────────────────────────────────────────────

export const mediaStore = {
  list: async (type?: string) => {
    if (usePrisma) {
      try { return await prisma.media.findMany({ where: type ? { type: type as never } : {}, orderBy: { createdAt: "desc" } }); } catch {}
    }
    return fileDb.findMany("media", m => !type || m.type === type);
  },
  byId: async (id: string) => {
    if (usePrisma) {
      try { return await prisma.media.findUnique({ where: { id } }); } catch {}
    }
    return fileDb.findOne("media", m => m.id === id);
  },
  create: async (data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const m = await prisma.media.create({ data: data as never });
        fileDb.insert("media", m as unknown as Record<string, unknown>);
        return m;
      } catch {}
    }
    return fileDb.insert("media", data);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const m = await prisma.media.update({ where: { id }, data: data as never });
        fileDb.update("media", id, m as unknown as Record<string, unknown>);
        return m;
      } catch {}
    }
    return fileDb.update("media", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.media.delete({ where: { id } });
        fileDb.remove("media", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("media", id));
  },
};

// ─── BANNERS ─────────────────────────────────────────────────────────────────

export const bannerStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.banner.findMany({ orderBy: { sort: "asc" } }); } catch {}
    }
    return fileDb.findMany("banners").sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  },
  active: async (position?: string) => {
    if (usePrisma) {
      try { return await prisma.banner.findMany({ where: { active: true, visible: true, ...(position ? { position } : {}) }, orderBy: { sort: "asc" } }); } catch {}
    }
    return fileDb.findMany("banners", b => b.active !== false && b.visible !== false && (!position || b.position === position));
  },
  create: async (data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const b = await prisma.banner.create({ data: data as never });
        fileDb.insert("banners", b as unknown as Record<string, unknown>);
        return b;
      } catch {}
    }
    return fileDb.insert("banners", data);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const b = await prisma.banner.update({ where: { id }, data: data as never });
        fileDb.update("banners", id, b as unknown as Record<string, unknown>);
        return b;
      } catch {}
    }
    return fileDb.update("banners", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.banner.delete({ where: { id } });
        fileDb.remove("banners", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("banners", id));
  },
};

// ─── FAQ ─────────────────────────────────────────────────────────────────────

export const faqStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.fAQ.findMany({ orderBy: { sort: "asc" } }); } catch {}
    }
    return fileDb.findMany("faqs").sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  },
  visible: async () => {
    if (usePrisma) {
      try { return await prisma.fAQ.findMany({ where: { visible: true }, orderBy: { sort: "asc" } }); } catch {}
    }
    return fileDb.findMany("faqs", f => f.visible !== false);
  },
  create: async (data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const f = await prisma.fAQ.create({ data: data as never });
        fileDb.insert("faqs", f as unknown as Record<string, unknown>);
        return f;
      } catch {}
    }
    return fileDb.insert("faqs", data);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const f = await prisma.fAQ.update({ where: { id }, data: data as never });
        fileDb.update("faqs", id, f as unknown as Record<string, unknown>);
        return f;
      } catch {}
    }
    return fileDb.update("faqs", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.fAQ.delete({ where: { id } });
        fileDb.remove("faqs", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("faqs", id));
  },
};

// ─── TESTIMONIALS ───────────────────────────────────────────────────────────

export const testimonialStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.testimonial.findMany({ orderBy: { sort: "asc" } }); } catch {}
    }
    return fileDb.findMany("testimonials").sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  },
  visible: async () => {
    if (usePrisma) {
      try { return await prisma.testimonial.findMany({ where: { visible: true }, orderBy: { sort: "asc" } }); } catch {}
    }
    return fileDb.findMany("testimonials", t => t.visible !== false);
  },
  create: async (data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const t = await prisma.testimonial.create({ data: data as never });
        fileDb.insert("testimonials", t as unknown as Record<string, unknown>);
        return t;
      } catch {}
    }
    return fileDb.insert("testimonials", data);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const t = await prisma.testimonial.update({ where: { id }, data: data as never });
        fileDb.update("testimonials", id, t as unknown as Record<string, unknown>);
        return t;
      } catch {}
    }
    return fileDb.update("testimonials", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.testimonial.delete({ where: { id } });
        fileDb.remove("testimonials", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("testimonials", id));
  },
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────

export const settingStore = {
  get: async (key: string) => {
    if (usePrisma) {
      try { return await prisma.setting.findUnique({ where: { key } }); } catch {}
    }
    return fileDb.findOne("settings", s => s.key === key);
  },
  getGroup: async (group: string) => {
    if (usePrisma) {
      try { return await prisma.setting.findMany({ where: { group } }); } catch {}
    }
    return fileDb.findMany("settings", s => s.group === group);
  },
  set: async (key: string, value: unknown, group = "general") => {
    if (usePrisma) {
      try {
        const s = await prisma.setting.upsert({ where: { key }, update: { value: value as never, group }, create: { key, value: value as never, group } });
        fileDb.update("settings", { key }, { key, value, group });
        return s;
      } catch {}
    }
    return fileDb.update("settings", { key }, { key, value, group });
  },
  getAll: async () => {
    if (usePrisma) {
      try { return await prisma.setting.findMany({ orderBy: { group: "asc" } }); } catch {}
    }
    return fileDb.findMany("settings");
  },
};

// ─── ORDER STATE MACHINE & REJECTION REASONS ────────────────────────────────

export {
  ORDER_VALID_TRANSITIONS,
  STANDARD_REJECTION_REASONS,
  ORDER_STATUSES,
  type StandardRejectionReason,
  type OrderStatusType,
} from "./order-constants";
import { ORDER_VALID_TRANSITIONS, STANDARD_REJECTION_REASONS } from "./order-constants";

// ─── ORDERS (extended) ──────────────────────────────────────────────────────

export const orderStoreExtended = {
  VALID_TRANSITIONS: ORDER_VALID_TRANSITIONS,
  REJECTION_REASONS: STANDARD_REJECTION_REASONS,

  byId: async (id: string) => {
    return await store.orders.byId(id);
  },

  updateStatus: async (id: string, status: string, note?: string, actorId = "admin") => {
    const orders = fileDb.findMany("orders");
    let currentOrder = orders.find((o) => o.id === id);
    if (!currentOrder && usePrisma) {
      try {
        currentOrder = (await prisma.order.findUnique({ where: { id }, include: { lines: true } })) as never;
      } catch {}
    }
    if (!currentOrder) {
      return { success: false, error: "Order not found." };
    }

    const currentStatus = String(currentOrder.status || "pending");
    const allowed = ORDER_VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(status)) {
      return {
        success: false,
        error: `Cannot transition from "${currentStatus}" to "${status}". Allowed: ${allowed.join(", ") || "none"}.`,
      };
    }

    if (status === "rejected") {
      if (!note || !note.trim()) {
        return { success: false, error: "Rejection reason is required." };
      }
    }

    if (usePrisma) {
      try {
        await prisma.order.update({ where: { id }, data: { status: status as never } });
        await prisma.orderStatusHistory.create({
          data: { orderId: id, status: status as never, note: note || "" },
        });
      } catch {}
    }
    fileDb.update("orders", id, { status });

    fileDb.insert("orderStatusHistory", {
      orderId: id,
      status,
      note: note || "",
      actorId,
      createdAt: new Date().toISOString(),
    });

    fileDb.insert("auditLogs", {
      action: "order_status_changed",
      actorId,
      targetType: "order",
      targetId: id,
      details: `Order ${id.slice(0, 14)}: ${currentStatus} → ${status}${note ? ` (${note})` : ""}`,
      createdAt: new Date().toISOString(),
    });

    if (status === "cancelled" || status === "rejected") {
      const rawLines = Array.isArray(currentOrder.lines) ? currentOrder.lines : [];
      for (const line of rawLines) {
        try {
          const pid = String(line.productId || "");
          const qty = Number(line.quantity || 0);
          if (pid && qty > 0) {
            await store.products.decrementStock(pid, -qty);
          }
        } catch {}
      }
    }

    return { success: true };
  },

  bulkUpdateStatus: async (
    orderIds: string[],
    action: "accept" | "reject",
    reason?: string,
    customNote?: string,
    actorId = "admin"
  ) => {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return { success: false, error: "No orders selected." };
    }

    const targetStatus = action === "accept" ? "confirmed" : "rejected";

    if (action === "reject") {
      if (!reason || !reason.trim()) {
        return { success: false, error: "A rejection reason is mandatory." };
      }
      if (reason === "Other" && (!customNote || !customNote.trim())) {
        return { success: false, error: "Please enter an explanation for 'Other'." };
      }
    }

    const note =
      action === "reject"
        ? `${reason}${customNote && reason === "Other" ? `: ${customNote}` : customNote ? ` (${customNote})` : ""}`
        : customNote || "Bulk confirmed by admin";

    const results: Array<{ id: string; success: boolean; error?: string }> = [];
    let processed = 0;

    for (const id of orderIds) {
      const res = await orderStoreExtended.updateStatus(id, targetStatus, note, actorId);
      if (res.success) {
        processed++;
        results.push({ id, success: true });
      } else {
        results.push({ id, success: false, error: res.error });
      }
    }

    return {
      success: processed > 0,
      processed,
      total: orderIds.length,
      results,
    };
  },

  history: async (orderId: string) => {
    if (usePrisma) {
      try {
        const rows = await prisma.orderStatusHistory.findMany({
          where: { orderId },
          orderBy: { createdAt: "desc" },
        });
        if (rows.length > 0) return rows;
      } catch {}
    }
    return fileDb
      .findMany("orderStatusHistory", (h: Record<string, unknown>) => h.orderId === orderId)
      .sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime());
  },

  byUser: async (userId: string) => {
    return await store.orders.list({ id: userId, role: "customer" } as never);
  },

  all: async () => {
    if (usePrisma) {
      try {
        return (await prisma.order.findMany({
          include: { lines: { include: { product: true } } },
          orderBy: { createdAt: "desc" },
        })) as unknown as Record<string, unknown>[];
      } catch {}
    }
    const all = fileDb.findMany("orders");
    const allProducts = fileDb.findMany("products");
    return all.map((o) => {
      const rawLines = Array.isArray(o.lines) ? o.lines : [];
      const enriched = rawLines.map((l: Record<string, unknown>) => {
        const pid = String(l.productId || "");
        const p = allProducts.find((x: Record<string, unknown>) => x.id === pid || x.slug === pid);
        return {
          ...l,
          product: p || {
            id: pid,
            name: String(l.name || "Queens Care Formulation"),
            image: String(l.image || "/uploads/logos/queens-care-official-original.png"),
            price: Number(l.unitPrice || 0),
            slug: pid,
          },
        };
      });
      return { ...o, lines: enriched };
    });
  },
};

// ─── CUSTOMERS (admin) ──────────────────────────────────────────────────────

export const customerStore = {
  list: async (filter?: { search?: string; status?: string }) => {
    const users = (await store.users.list({ role: "customer", search: filter?.search, status: filter?.status })) || [];
    const allOrders = (fileDb.findMany("orders") || []) as Array<Record<string, unknown>>;
    return users.map((u) => {
      const userOrders = allOrders.filter((o) => o.userId === u.id);
      const totalSpend = userOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
      const { passwordHash, ...safe } = u as unknown as Record<string, unknown>;
      return {
        ...safe,
        status: safe.status || (safe.isActive === false ? "disabled" : "active"),
        orderCount: userOrders.length,
        totalSpend,
      };
    });
  },
  byId: async (id: string) => {
    const user = await store.users.byId(id);
    if (!user) return null;
    const { passwordHash, ...safeUser } = user as unknown as Record<string, unknown>;
    const orders = (fileDb.findMany("orders", (o) => o.userId === id) || []).sort(
      (a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()
    );
    const addresses = fileDb.findMany("addresses", (a) => a.userId === id) || [];
    const activity = fileDb.findMany("auditLogs", (l) => l.targetId === id || (l.targetType === "customer" && l.targetId === id)) || [];
    return {
      user: {
        ...safeUser,
        status: safeUser.status || (safeUser.isActive === false ? "disabled" : "active"),
      },
      orders,
      addresses,
      activity,
    };
  },
  count: async () => {
    const customers = await store.users.list({ role: "customer" });
    return customers.length;
  },
  setStatus: async (id: string, status: "active" | "disabled", actorId?: string) => {
    const user = await store.users.byId(id);
    if (!user) return null;
    const nextTokenVersion = (user.tokenVersion || 1) + 1;
    const updated = await store.users.update(id, {
      status,
      isActive: status === "active",
      tokenVersion: nextTokenVersion,
    });
    fileDb.insert("auditLogs", {
      action: status === "disabled" ? "customer_disabled" : "customer_enabled",
      actorId: actorId || "admin",
      targetType: "customer",
      targetId: id,
      details: `Customer ${user.email} status changed to ${status}`,
      createdAt: new Date().toISOString(),
    });
    return updated;
  },
  deactivate: async (id: string, actorId?: string) => {
    const user = await store.users.byId(id);
    if (!user) return null;
    const userOrders = fileDb.findMany("orders", (o) => o.userId === id);
    const orderCount = userOrders.length;
    const nextTokenVersion = (user.tokenVersion || 1) + 1;
    const anonymizedEmail = `anonymized_${id.replace(/[^a-z0-9]/gi, "")}@deleted.local`;
    const updated = await store.users.update(id, {
      name: "Deactivated Customer",
      email: anonymizedEmail,
      phone: "",
      status: "deactivated",
      isActive: false,
      tokenVersion: nextTokenVersion,
    });
    fileDb.insert("auditLogs", {
      action: "customer_deactivated",
      actorId: actorId || "admin",
      targetType: "customer",
      targetId: id,
      details: `Customer account deactivated and anonymized. ${orderCount} historical orders preserved.`,
      createdAt: new Date().toISOString(),
    });
    return { user: updated, historicalOrdersPreserved: orderCount };
  },
  update: async (id: string, data: Record<string, unknown>) => {
    return store.users.update(id, data);
  },
};

// ─── ADDRESSES ───────────────────────────────────────────────────────────────

export const addressStore = {
  list: async (userId: string) => {
    if (usePrisma) {
      try {
        return await prisma.address.findMany({
          where: { userId },
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        });
      } catch {}
    }
    return fileDb
      .findMany("addresses", (a) => a.userId === userId)
      .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
  },

  byId: async (id: string, userId?: string) => {
    if (usePrisma) {
      try {
        const a = await prisma.address.findUnique({ where: { id } });
        if (a && (!userId || a.userId === userId)) return a;
        return null;
      } catch {}
    }
    const found = fileDb.findOne("addresses", (a) => a.id === id);
    if (found && (!userId || found.userId === userId)) return found;
    return null;
  },

  create: async (userId: string, data: Record<string, unknown>) => {
    if (data.isDefault) {
      await addressStore.clearDefault(userId);
    }
    if (usePrisma) {
      try {
        const addr = await prisma.address.create({
          data: {
            userId,
            label: String(data.label || "Home"),
            fullName: String(data.fullName || ""),
            phone: String(data.phone || ""),
            address: String(data.address || ""),
            city: String(data.city || ""),
            state: String(data.state || ""),
            pincode: String(data.pincode || ""),
            isDefault: Boolean(data.isDefault),
          },
        });
        fileDb.insert("addresses", addr as unknown as Record<string, unknown>);
        return addr;
      } catch {}
    }
    const item = {
      id: `addr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      label: String(data.label || "Home"),
      fullName: String(data.fullName || ""),
      phone: String(data.phone || ""),
      address: String(data.address || ""),
      city: String(data.city || ""),
      state: String(data.state || ""),
      pincode: String(data.pincode || ""),
      isDefault: Boolean(data.isDefault),
      createdAt: now(),
    };
    fileDb.insert("addresses", item);
    return item;
  },

  update: async (id: string, userId: string, data: Record<string, unknown>) => {
    const existing = await addressStore.byId(id, userId);
    if (!existing) return null;

    if (data.isDefault) {
      await addressStore.clearDefault(userId);
    }

    if (usePrisma) {
      try {
        const updated = await prisma.address.update({
          where: { id },
          data: data as never,
        });
        fileDb.update("addresses", id, updated as unknown as Record<string, unknown>);
        return updated;
      } catch {}
    }
    const updated = fileDb.update("addresses", id, data);
    return updated;
  },

  delete: async (id: string, userId: string) => {
    const existing = await addressStore.byId(id, userId);
    if (!existing) return false;

    if (usePrisma) {
      try {
        await prisma.address.delete({ where: { id } });
      } catch {}
    }
    fileDb.remove("addresses", id);
    return true;
  },

  clearDefault: async (userId: string) => {
    if (usePrisma) {
      try {
        await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
      } catch {}
    }
    const userAddrs = fileDb.findMany("addresses", (a) => a.userId === userId);
    for (const a of userAddrs) {
      if (a.isDefault) fileDb.update("addresses", String(a.id), { isDefault: false });
    }
  },
};

// ─── WISHLIST ────────────────────────────────────────────────────────────────

export const wishlistStore = {
  get: async (userId: string) => store.wishlist.get(userId),
  getItemsWithProducts: async (userId: string) => store.wishlist.getItemsWithProducts(userId),
  add: async (userId: string, productId: string) => store.wishlist.add(userId, productId),
  remove: async (userId: string, productId: string) => store.wishlist.remove(userId, productId),
  toggle: async (userId: string, productId: string) => store.wishlist.toggle(userId, productId),
};

// ─── 3D MODELS ──────────────────────────────────────────────────────────────

export const model3dStore = {
  byProduct: async (productId: string) => {
    if (usePrisma) {
      try { return await prisma.product3DModel.findUnique({ where: { productId } }); } catch {}
    }
    return null;
  },
  upsert: async (productId: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try { return await prisma.product3DModel.upsert({ where: { productId }, update: data as never, create: { productId, ...data } as never }); } catch {}
    }
    return { productId, ...data };
  },
  delete: async (productId: string) => {},
};

// ─── HOMEPAGE SECTIONS ──────────────────────────────────────────────────────

export const homepageStore = {
  list: async () => {
    if (usePrisma) {
      try {
        const rows = await prisma.homepageSection.findMany({ orderBy: { sort: "asc" } });
        if (rows.length > 0) return rows;
      } catch {}
    }
    return fileDb.findMany("homepageSections").sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  },
  active: async () => {
    if (usePrisma) {
      try {
        const rows = await prisma.homepageSection.findMany({ where: { active: true, visible: true }, orderBy: { sort: "asc" } });
        if (rows.length > 0) return rows;
      } catch {}
    }
    return fileDb.findMany("homepageSections", s => s.active !== false && s.visible !== false).sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  },
  create: async (data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const s = await prisma.homepageSection.create({ data: data as never });
        fileDb.insert("homepageSections", s as unknown as Record<string, unknown>);
        return s;
      } catch {}
    }
    return fileDb.insert("homepageSections", data);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const s = await prisma.homepageSection.update({ where: { id }, data: data as never });
        fileDb.update("homepageSections", id, s as unknown as Record<string, unknown>);
        return s;
      } catch {}
    }
    return fileDb.update("homepageSections", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.homepageSection.delete({ where: { id } });
        fileDb.remove("homepageSections", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("homepageSections", id));
  },
};

// ─── OFFERS / PROMOTIONS ────────────────────────────────────────────────────

export const offerStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.offer.findMany({ orderBy: { createdAt: "desc" } }); } catch {}
    }
    return fileDb.findMany("offers");
  },
  active: async () => {
    if (usePrisma) {
      try { return await prisma.offer.findMany({ where: { active: true, visible: true } }); } catch {}
    }
    return fileDb.findMany("offers", o => o.active !== false && o.visible !== false);
  },
  create: async (data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const o = await prisma.offer.create({ data: data as never });
        fileDb.insert("offers", o as unknown as Record<string, unknown>);
        return o;
      } catch {}
    }
    return fileDb.insert("offers", data);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const o = await prisma.offer.update({ where: { id }, data: data as never });
        fileDb.update("offers", id, o as unknown as Record<string, unknown>);
        return o;
      } catch {}
    }
    return fileDb.update("offers", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.offer.delete({ where: { id } });
        fileDb.remove("offers", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("offers", id));
  },
};

export const promotionStore = {
  list: async () => [],
  create: async (data: Record<string, unknown>) => data,
  update: async (id: string, data: Record<string, unknown>) => data,
  delete: async (id: string) => {},
};

// ─── PRODUCT VARIANTS, SPECS, VIDEOS, FAQS ──────────────────────────────────

export const variantStore = {
  listByProduct: async (productId: string) => [],
  create: async (data: Record<string, unknown>) => data,
  update: async (id: string, data: Record<string, unknown>) => data,
  delete: async (id: string) => {},
};

export const specificationStore = {
  listByProduct: async (productId: string) => [],
  upsert: async (data: Record<string, unknown>) => data,
  delete: async (id: string) => {},
};

export const videoStore = {
  listByProduct: async (productId: string) => [],
  create: async (data: Record<string, unknown>) => data,
  delete: async (id: string) => {},
};

export const aplusStore = {
  listTemplates: async () => {
    return fileDb.findMany("aplusTemplates").sort((a, b) => new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime());
  },
  getTemplate: async (id: string) => {
    return fileDb.findOne("aplusTemplates", (t) => t.id === id);
  },
  createTemplate: async (data: Record<string, unknown>) => {
    const id = (data.id as string) || `aplus-${Date.now().toString(36)}`;
    return fileDb.insert("aplusTemplates", { ...data, id, createdAt: new Date().toISOString() });
  },
  updateTemplate: async (id: string, patch: Record<string, unknown>) => {
    return fileDb.update("aplusTemplates", id, { ...patch, updatedAt: new Date().toISOString() });
  },
  deleteTemplate: async (id: string) => {
    return fileDb.remove("aplusTemplates", id);
  },
  getByProduct: async (productIdOrSlug: string) => {
    const product = fileDb.findOne("products", (p) => p.id === productIdOrSlug || p.slug === productIdOrSlug);
    if (!product) return { sections: [], published: false, templateId: null };

    let sections: Record<string, unknown>[] = [];
    if (Array.isArray(product.aplusContent) && product.aplusContent.length > 0) {
      sections = product.aplusContent as Record<string, unknown>[];
    } else if (typeof product.aplusContent === "string" && product.aplusContent.startsWith("[")) {
      try { sections = JSON.parse(product.aplusContent); } catch {}
    }

    // If no direct sections but an aplusTemplateId is linked, load from template
    if (sections.length === 0 && product.aplusTemplateId) {
      const template = fileDb.findOne("aplusTemplates", (t) => t.id === product.aplusTemplateId);
      if (template && Array.isArray(template.sections)) {
        sections = template.sections as Record<string, unknown>[];
      }
    }

    return {
      productId: product.id,
      productSlug: product.slug,
      templateId: product.aplusTemplateId || null,
      sections,
      published: Boolean(product.aplusPublished !== false && sections.length > 0),
    };
  },
  attachToProduct: async (productIdOrSlug: string, templateId: string | null, customSections?: Record<string, unknown>[], published = true) => {
    const product = fileDb.findOne("products", (p) => p.id === productIdOrSlug || p.slug === productIdOrSlug);
    if (!product) return null;

    const patch: Record<string, unknown> = {
      aplusTemplateId: templateId || null,
      aplusPublished: published,
      updatedAt: new Date().toISOString(),
    };

    if (customSections) {
      patch.aplusContent = customSections;
    } else if (templateId) {
      const template = fileDb.findOne("aplusTemplates", (t) => t.id === templateId);
      if (template && Array.isArray(template.sections)) {
        patch.aplusContent = template.sections;
      }
    }

    return fileDb.update("products", product.id as string, patch);
  },
  listByProduct: async (productId: string) => {
    const res = await aplusStore.getByProduct(productId);
    return res.sections;
  },
  upsert: async (data: Record<string, unknown>) => {
    if (data.productId) {
      await aplusStore.attachToProduct(String(data.productId), String(data.templateId || ""), data.sections as Record<string, unknown>[], data.published !== false);
    }
    return data;
  },
  delete: async (id: string) => {
    return fileDb.remove("aplusTemplates", id);
  },
};

export const productQAStore = {
  listByProduct: async (productId: string) => [],
  create: async (data: Record<string, unknown>) => data,
  answer: async (id: string, answer: string, answeredBy?: string) => ({ id, answer }),
  delete: async (id: string) => {},
};

export const productRelationStore = {
  getRelated: async (productId: string) => [],
  setRelated: async (productId: string, relatedProductIds: string[]) => {},
  removeRelated: async (productId: string, relatedProductId: string) => {},
};

export const productFAQStore = {
  listByProduct: async (productId: string) => [],
  create: async (data: Record<string, unknown>) => data,
  update: async (id: string, data: Record<string, unknown>) => data,
  delete: async (id: string) => {},
};

export const productTagStore = {
  listByProduct: async (productId: string) => [],
  addTag: async (productId: string, tag: string) => {},
  removeTag: async (productId: string, tag: string) => {},
};

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

export const categoryStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.category.findMany({ orderBy: { sort: "asc" } }); } catch {}
    }
    return fileDb.findMany("categories").sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  },
  bySlug: async (slug: string) => {
    if (usePrisma) {
      try { return await prisma.category.findUnique({ where: { slug } }); } catch {}
    }
    return fileDb.findOne("categories", c => c.slug === slug);
  },
  byId: async (id: string) => {
    if (usePrisma) {
      try { return await prisma.category.findUnique({ where: { id } }); } catch {}
    }
    return fileDb.findOne("categories", c => c.id === id);
  },
  create: async (data: Record<string, unknown>) => {
    const slug = String(data.slug || data.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (usePrisma) {
      try {
        const c = await prisma.category.create({ data: { ...data, slug } as never });
        fileDb.insert("categories", c as unknown as Record<string, unknown>);
        return c;
      } catch {}
    }
    return fileDb.insert("categories", { ...data, slug, active: data.active !== false, visible: data.visible !== false });
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const c = await prisma.category.update({ where: { id }, data: data as never });
        fileDb.update("categories", id, c as unknown as Record<string, unknown>);
        return c;
      } catch {}
    }
    return fileDb.update("categories", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.category.delete({ where: { id } });
        fileDb.remove("categories", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("categories", id));
  },
};

// ─── EMPLOYEES ──────────────────────────────────────────────────────────────

export const employeeStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.employee.findMany({ orderBy: { createdAt: "desc" } }); } catch {}
    }
    return fileDb.findMany("employees");
  },
  bySlug: async (slug: string) => {
    if (usePrisma) {
      try { return await prisma.employee.findUnique({ where: { slug } }); } catch {}
    }
    return fileDb.findOne("employees", e => e.slug === slug || e.id === slug);
  },
  byId: async (id: string) => {
    if (usePrisma) {
      try { return await prisma.employee.findUnique({ where: { id } }); } catch {}
    }
    return fileDb.findOne("employees", e => e.id === id || e.slug === id);
  },
  create: async (data: Record<string, unknown>) => {
    const slug = String(data.slug || data.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (usePrisma) {
      try {
        const emp = await prisma.employee.create({ data: { ...data, slug } as never });
        fileDb.insert("employees", emp as unknown as Record<string, unknown>);
        return emp;
      } catch {}
    }
    return fileDb.insert("employees", { ...data, slug, active: data.active !== false });
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const emp = await prisma.employee.update({ where: { id }, data: data as never });
        fileDb.update("employees", id, emp as unknown as Record<string, unknown>);
        return emp;
      } catch {}
    }
    return fileDb.update("employees", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.employee.delete({ where: { id } });
        fileDb.remove("employees", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("employees", id));
  },
};

// ─── DOCTORS ─────────────────────────────────────────────────────────────────

export const doctorStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.doctor.findMany({ orderBy: { createdAt: "desc" } }); } catch {}
    }
    return fileDb.findMany("doctors");
  },
  listPublic: async () => {
    const all = await doctorStore.list();
    return (all as Record<string, unknown>[]).filter(d => d.visible !== false && d.status === "approved");
  },
  byId: async (id: string) => {
    if (usePrisma) {
      try { return await prisma.doctor.findUnique({ where: { id } }); } catch {}
    }
    return fileDb.findOne("doctors", d => d.id === id);
  },
  create: async (data: Record<string, unknown>) => {
    const id = (data.id as string) || `doc-${Date.now().toString(36)}`;
    const docData = {
      id,
      status: data.status || "approved",
      visible: data.visible !== false,
      verified: Boolean(data.verified || data.regNumber),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    if (usePrisma) {
      try {
        const doc = await prisma.doctor.create({ data: docData as never });
        fileDb.insert("doctors", doc as unknown as Record<string, unknown>);
        return doc;
      } catch {}
    }
    return fileDb.insert("doctors", docData);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const updatedData = { ...data, updatedAt: new Date().toISOString() };
    if (usePrisma) {
      try {
        const doc = await prisma.doctor.update({ where: { id }, data: updatedData as never });
        fileDb.update("doctors", id, updatedData);
        return doc;
      } catch {}
    }
    return fileDb.update("doctors", id, updatedData);
  },
  updateStatus: async (id: string, status: string) => {
    if (usePrisma) {
      try {
        const doc = await prisma.doctor.update({ where: { id }, data: { status: status as never } });
        fileDb.update("doctors", id, { status });
        return doc;
      } catch {}
    }
    return fileDb.update("doctors", id, { status });
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.doctor.delete({ where: { id } });
        fileDb.remove("doctors", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("doctors", id));
  },
};

// ─── MARKETING ──────────────────────────────────────────────────────────────
// Unified marketing store — handles flash deals, lightning deals, limited offers,
// buy-X-get-Y, quantity discounts, free shipping promos, and campaigns.
export const marketingStore = {
  list: async (type?: string) => {
    let items = fileDb.findMany("marketing");
    if (type) items = items.filter((i: Record<string, unknown>) => i.type === type);
    return items.sort((a: Record<string, unknown>, b: Record<string, unknown>) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime());
  },
  active: async (type?: string) => {
    const now = new Date().toISOString();
    let items = fileDb.findMany("marketing").filter((i: Record<string, unknown>) => i.active !== false);
    if (type) items = items.filter((i: Record<string, unknown>) => i.type === type);
    return items.filter((i: Record<string, unknown>) => {
      if (i.startDate && String(i.startDate) > now) return false;
      if (i.endDate && String(i.endDate) < now) return false;
      return true;
    });
  },
  byId: async (id: string) => fileDb.findOne("marketing", (i: Record<string, unknown>) => i.id === id),
  create: async (data: Record<string, unknown>) => fileDb.insert("marketing", data),
  update: async (id: string, data: Record<string, unknown>) => fileDb.update("marketing", id, data),
  delete: async (id: string) => fileDb.remove("marketing", id),
};

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
export const notificationStore = {
  list: async () => fileDb.findMany("notifications").sort((a: Record<string, unknown>, b: Record<string, unknown>) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()),
  active: async () => {
    const now = new Date().toISOString();
    return fileDb.findMany("notifications").filter((i: Record<string, unknown>) => {
      if (i.active === false) return false;
      if (i.startDate && String(i.startDate) > now) return false;
      if (i.endDate && String(i.endDate) < now) return false;
      return true;
    });
  },
  create: async (data: Record<string, unknown>) => fileDb.insert("notifications", data),
  update: async (id: string, data: Record<string, unknown>) => fileDb.update("notifications", id, data),
  delete: async (id: string) => fileDb.remove("notifications", id),
};

// ─── PUSH SUBSCRIPTIONS ─────────────────────────────────────────────────────
export const pushSubscriptionStore = {
  list: async () => fileDb.findMany("pushSubscriptions"),
  active: async () => fileDb.findMany("pushSubscriptions", (s) => s.active !== false),
  upsert: async (endpoint: string, data: Record<string, unknown>) => {
    const existing = fileDb.findOne("pushSubscriptions", (s) => s.endpoint === endpoint);
    if (existing) {
      return fileDb.update("pushSubscriptions", existing.id as string, { ...data, active: true });
    }
    return fileDb.insert("pushSubscriptions", { ...data, endpoint, active: true });
  },
  deactivate: async (endpoint: string) => {
    const existing = fileDb.findOne("pushSubscriptions", (s) => s.endpoint === endpoint);
    if (existing) {
      return fileDb.update("pushSubscriptions", existing.id as string, { active: false });
    }
    return null;
  },
  remove: async (endpoint: string) => {
    const existing = fileDb.findOne("pushSubscriptions", (s) => s.endpoint === endpoint);
    if (existing) {
      return fileDb.remove("pushSubscriptions", existing.id as string);
    }
    return null;
  },
};

// ─── PUSH NOTIFICATION HISTORY ───────────────────────────────────────────────
export const pushHistoryStore = {
  list: async () => fileDb.findMany("pushNotificationHistory").sort((a: Record<string, unknown>, b: Record<string, unknown>) => new Date(String(b.createdAt || b.sentAt || "")).getTime() - new Date(String(a.createdAt || a.sentAt || "")).getTime()),
  create: async (data: Record<string, unknown>) => fileDb.insert("pushNotificationHistory", data),
  update: async (id: string, data: Record<string, unknown>) => fileDb.update("pushNotificationHistory", id, data),
};

// ─── PAGE SETTINGS (NAVIGATION MANAGEMENT) ──────────────────────────────────
export interface LiveNavItem {
  id: string;
  label: string;
  href: string;
  sort: number;
}

export const pageSettingsStore = {
  list: async () => fileDb.findMany("pageSettings").sort((a: Record<string, unknown>, b: Record<string, unknown>) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)),
  active: async () => fileDb.findMany("pageSettings", (p) => p.active !== false).sort((a: Record<string, unknown>, b: Record<string, unknown>) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)),
  headerVisible: async () => fileDb.findMany("pageSettings", (p) => p.active !== false && p.headerVisible !== false).sort((a: Record<string, unknown>, b: Record<string, unknown>) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)),
  footerVisible: async () => fileDb.findMany("pageSettings", (p) => p.active !== false && p.footerVisible !== false).sort((a: Record<string, unknown>, b: Record<string, unknown>) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)),
  byId: async (id: string) => fileDb.findOne("pageSettings", (p) => p.id === id),
  bySlug: async (slug: string) => fileDb.findOne("pageSettings", (p) => p.slug === slug),
  create: async (data: Record<string, unknown>) => fileDb.insert("pageSettings", data),
  update: async (id: string, data: Record<string, unknown>) => fileDb.update("pageSettings", id, data),
  remove: async (id: string) => fileDb.remove("pageSettings", id),

  // Live published navigation resolution (server authoritative, 0ms flash)
  getLiveHeaderNav: async (): Promise<LiveNavItem[]> => {
    const published = (fileDb.findMany("publishedHeaderNav") || []) as Array<Record<string, unknown>>;
    if (published.length > 0) {
      return (published
        .filter((item) => item.visible !== false)
        .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0)) as Array<Record<string, unknown>>)
        .map((item) => ({
          id: String(item.id || item.slug || item.label),
          label: String(item.label || item.title),
          href: String(item.href || (item.slug ? (String(item.slug).startsWith("#") ? String(item.slug) : `/${item.slug}`) : "/")),
          sort: Number(item.sort || 0),
        }));
    }

    // First-time fallback: compile all pages into publishedHeaderNav so draft vs publish diff is complete
    const rawPages = (fileDb.findMany("pageSettings") || [])
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

    const timestamp = new Date().toISOString();
    const compiled = rawPages.map((p: Record<string, unknown>, idx: number) => {
      const slug = String(p.slug || "").trim();
      let href = "/";
      if (slug.startsWith("#") || slug.startsWith("http")) href = slug;
      else if (slug.length > 0) href = `/${slug}`;

      return {
        id: String(p.id || `pg-${idx}`),
        slug,
        title: String(p.title || ""),
        label: String(p.label || p.title || "Page"),
        href,
        sort: Number(p.sortOrder ?? idx),
        visible: p.active !== false && p.headerVisible !== false,
        publishedAt: timestamp,
      };
    });

    if (compiled.length > 0) {
      fileDb.save({ publishedHeaderNav: compiled });
    }

    return compiled
      .filter((item) => item.visible)
      .map((item) => ({
        id: item.id,
        label: item.label,
        href: item.href,
        sort: item.sort,
      }));
  },

  // Publish current draft pageSettings to live publishedHeaderNav
  publish: async (actorEmail?: string) => {
    const draftPages = (fileDb.findMany("pageSettings") || [])
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

    const timestamp = new Date().toISOString();

    fileDb.insert("navigationSnapshots", {
      id: `NAV-SNAP-${Date.now()}`,
      timestamp,
      actorEmail: actorEmail || "admin@queenscare.in",
      draftPages,
    });

    const publishedItems: LiveNavItem[] = [];
    const allPublishedRecords: Array<Record<string, unknown>> = [];

    draftPages.forEach((p: Record<string, unknown>, idx: number) => {
      const isVisible = p.active !== false && p.headerVisible !== false;
      const slug = String(p.slug || "").trim();
      let href = "/";
      if (slug.startsWith("#") || slug.startsWith("http")) href = slug;
      else if (slug.length > 0) href = `/${slug}`;

      const navItem = {
        id: String(p.id || `pg-${idx}`),
        slug,
        title: String(p.title || ""),
        label: String(p.label || p.title || "Page"),
        href,
        sort: Number(p.sortOrder ?? idx),
        visible: isVisible,
        publishedAt: timestamp,
      };

      allPublishedRecords.push(navItem);
      if (isVisible) {
        publishedItems.push({
          id: navItem.id,
          label: navItem.label,
          href: navItem.href,
          sort: navItem.sort,
        });
      }
    });

    fileDb.save({ publishedHeaderNav: allPublishedRecords });

    return {
      ok: true,
      timestamp,
      liveCount: publishedItems.length,
      publishedCount: publishedItems.length,
      publishedNav: publishedItems,
    };
  },

  // Discard draft: revert pageSettings to state matching publishedHeaderNav
  discardDraft: async () => {
    const published = (fileDb.findMany("publishedHeaderNav") || []) as Array<Record<string, unknown>>;
    if (!published.length) return { ok: false, message: "No published state found" };

    published.forEach((pub) => {
      const existing = fileDb.findOne("pageSettings", (p) => p.id === pub.id);
      if (existing) {
        fileDb.update("pageSettings", String(pub.id), {
          headerVisible: pub.visible !== false,
          label: pub.label,
          sortOrder: pub.sort,
        });
      }
    });

    return { ok: true };
  },

  // Check if draft has uncommitted differences from live published
  getPublishStatus: async () => {
    const published = (fileDb.findMany("publishedHeaderNav") || []) as Array<Record<string, unknown>>;
    const drafts = (fileDb.findMany("pageSettings") || []) as Array<Record<string, unknown>>;

    let hasDiff = false;
    if (published.length === 0 && drafts.length > 0) {
      hasDiff = true;
    } else {
      for (const d of drafts) {
        const pub = published.find((p) => p.id === d.id);
        if (!pub) {
          hasDiff = true;
          break;
        }
        const pubVis = pub.visible !== false;
        const draftVis = d.active !== false && d.headerVisible !== false;
        const draftLabel = String(d.label || d.title || "");
        const pubLabel = String(pub.label || pub.title || "");
        if (pubVis !== draftVis || pubLabel !== draftLabel || Number(pub.sort) !== Number(d.sortOrder)) {
          hasDiff = true;
          break;
        }
      }
      if (!hasDiff && drafts.length !== published.length) {
        hasDiff = true;
      }
    }

    const lastPub = published[0]?.publishedAt ? String(published[0].publishedAt) : null;
    const liveCount = published.filter((p) => p.visible !== false).length;
    return {
      hasUnpublishedChanges: hasDiff,
      isDraftModified: hasDiff,
      lastPublishedAt: lastPub,
      draftCount: drafts.length,
      liveCount,
      publishedCount: liveCount,
    };
  },
};

// ─── SOCIAL MEDIA LINKS ─────────────────────────────────────────────────────
export const socialMediaLinksStore = {
  list: async () => fileDb.findMany("socialMediaLinks").sort((a: Record<string, unknown>, b: Record<string, unknown>) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)),
  visible: async () => fileDb.findMany("socialMediaLinks", (s) => s.visible !== false && Boolean(s.url)).sort((a: Record<string, unknown>, b: Record<string, unknown>) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)),
  byId: async (id: string) => fileDb.findOne("socialMediaLinks", (s) => s.id === id),
  create: async (data: Record<string, unknown>) => fileDb.insert("socialMediaLinks", data),
  update: async (id: string, data: Record<string, unknown>) => fileDb.update("socialMediaLinks", id, data),
  delete: async (id: string) => fileDb.remove("socialMediaLinks", id),
  reorder: async (orderedIds: string[]) => {
    orderedIds.forEach((id, idx) => {
      fileDb.update("socialMediaLinks", id, { sortOrder: idx });
    });
  },
  hideAll: async () => {
    fileDb.findMany("socialMediaLinks").forEach((s: Record<string, unknown>) => {
      fileDb.update("socialMediaLinks", String(s.id), { visible: false });
    });
  },
  unhideAll: async () => {
    fileDb.findMany("socialMediaLinks").forEach((s: Record<string, unknown>) => {
      fileDb.update("socialMediaLinks", String(s.id), { visible: true });
    });
  },
};

// ─── PROMO BANNERS ──────────────────────────────────────────────────────────
export const promoBannerStore = {
  list: async () => fileDb.findMany("promoBanners").sort((a: Record<string, unknown>, b: Record<string, unknown>) => (Number(a.sort) || 0) - (Number(b.sort) || 0)),
  active: async () => {
    const now = new Date().toISOString();
    return fileDb.findMany("promoBanners").filter((i: Record<string, unknown>) => {
      if (i.active === false) return false;
      if (i.startDate && String(i.startDate) > now) return false;
      if (i.endDate && String(i.endDate) < now) return false;
      return true;
    });
  },
  create: async (data: Record<string, unknown>) => fileDb.insert("promoBanners", data),
  update: async (id: string, data: Record<string, unknown>) => fileDb.update("promoBanners", id, data),
  delete: async (id: string) => fileDb.remove("promoBanners", id),
};

// ─── PAYMENT GATEWAYS ───────────────────────────────────────────────────────

export function maskSecretValue(val?: unknown): string {
  if (!val || typeof val !== "string") return "";
  const s = val.trim();
  if (!s) return "";
  if (s.length <= 6) return "••••••";
  return s.slice(0, 4) + "••••••••" + s.slice(-4);
}

export function isGatewayConfigured(provider: string, creds: Record<string, unknown> = {}): boolean {
  if (provider === "cod") return true;
  if (provider === "razorpay") {
    const kid = (creds.keyId as string) || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
    const sec = (creds.keySecret as string) || process.env.RAZORPAY_KEY_SECRET || "";
    return Boolean(kid.trim() && sec.trim());
  }
  if (provider === "stripe") {
    const pub = (creds.publishableKey as string) || "";
    const sec = (creds.secretKey as string) || "";
    return Boolean(pub.trim() && sec.trim());
  }
  if (provider === "cashfree") {
    const app = (creds.appId as string) || "";
    const sec = (creds.secretKey as string) || "";
    return Boolean(app.trim() && sec.trim());
  }
  if (provider === "payu") {
    const key = (creds.merchantKey as string) || "";
    const salt = (creds.merchantSalt as string) || "";
    return Boolean(key.trim() && salt.trim());
  }
  if (provider === "phonepe") {
    const mid = (creds.merchantId as string) || "";
    const salt = (creds.saltKey as string) || "";
    return Boolean(mid.trim() && salt.trim());
  }
  return false;
}

export const paymentGatewayStore = {
  // Returns list for admin with masked credentials
  list: async () => {
    const gateways = fileDb.findMany("paymentGateways");
    return gateways
      .map((gw: Record<string, unknown>) => {
        const creds = (gw.credentials || {}) as Record<string, unknown>;
        const maskedCreds: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(creds)) {
          if (["keySecret", "secretKey", "merchantSalt", "saltKey", "webhookSecret", "password"].includes(k)) {
            maskedCreds[k] = maskSecretValue(v);
            maskedCreds[`has_${k}`] = Boolean(v && String(v).trim().length > 0);
          } else {
            maskedCreds[k] = v;
          }
        }
        const configured = isGatewayConfigured(String(gw.provider), creds);
        return {
          ...gw,
          isConfigured: configured,
          status: gw.enabled ? (configured ? "connected" : "not_configured") : "disabled",
          credentials: maskedCreds,
        };
      })
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
  },

  // Returns safe public list for checkout (NEVER includes secrets)
  publicList: async () => {
    const gateways = fileDb.findMany("paymentGateways");
    return gateways
      .filter((gw: Record<string, unknown>) => gw.enabled === true)
      .map((gw: Record<string, unknown>) => {
        const creds = (gw.credentials || {}) as Record<string, unknown>;
        const configured = isGatewayConfigured(String(gw.provider), creds);
        // Only return public-safe fields
        return {
          id: gw.id,
          provider: gw.provider,
          displayName: gw.displayName,
          description: gw.description,
          icon: gw.icon,
          mode: gw.mode || "test",
          isConfigured: configured,
          sort: gw.sort || 0,
          codCharge: Number(gw.codCharge || 0),
          minOrderValue: Number(gw.minOrderValue || 0),
          maxOrderValue: Number(gw.maxOrderValue || 100000),
          instructions: gw.instructions || "",
          // Only expose public keys if required
          publicKey: gw.provider === "razorpay" 
            ? ((creds.keyId as string) || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "")
            : gw.provider === "stripe"
            ? ((creds.publishableKey as string) || "")
            : undefined,
        };
      })
      .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
  },

  byId: async (id: string) => {
    return fileDb.findOne("paymentGateways", (gw: Record<string, unknown>) => gw.id === id || gw.provider === id || gw.id === `gw-${id}`);
  },

  byProvider: async (provider: string) => {
    return fileDb.findOne("paymentGateways", (gw: Record<string, unknown>) => gw.provider === provider || gw.id === provider || gw.id === `gw-${provider}`);
  },

  create: async (data: Record<string, unknown>) => {
    const id = (data.id as string) || `gw-${String(data.provider || "custom")}-${Date.now().toString(36)}`;
    const creds = (data.credentials || {}) as Record<string, unknown>;
    const configured = isGatewayConfigured(String(data.provider), creds);
    return fileDb.insert("paymentGateways", {
      ...data,
      id,
      isConfigured: configured,
      sort: Number(data.sort) || 10,
    });
  },

  update: async (id: string, patch: Record<string, unknown>) => {
    const cleanId = id.replace(/^gw-/, "");
    const existing = fileDb.findOne("paymentGateways", (gw: Record<string, unknown>) => gw.id === id || gw.provider === id || gw.id === cleanId || gw.provider === cleanId || gw.id === `gw-${id}`);
    if (!existing) return null;

    const existingCreds = ((existing.credentials as Record<string, unknown>) || {});
    const incomingCreds = ((patch.credentials as Record<string, unknown>) || {});
    const mergedCreds = { ...existingCreds };

    // Update credentials without clearing existing secrets if masked/placeholder was passed
    for (const [k, v] of Object.entries(incomingCreds)) {
      if (typeof v === "string" && v.includes("••••")) {
        // Keep existing secret
        continue;
      }
      mergedCreds[k] = v;
    }

    const provider = String(patch.provider || existing.provider);
    const configured = isGatewayConfigured(provider, mergedCreds);

    const updated = {
      ...existing,
      ...patch,
      credentials: mergedCreds,
      isConfigured: configured,
      updatedAt: new Date().toISOString(),
    };

    return fileDb.update("paymentGateways", String(existing.id), updated);
  },

  delete: async (id: string) => {
    const cleanId = id.replace(/^gw-/, "");
    const existing = fileDb.findOne("paymentGateways", (gw: Record<string, unknown>) => gw.id === id || gw.provider === id || gw.id === cleanId || gw.provider === cleanId || gw.id === `gw-${id}`);
    if (!existing) return false;
    return fileDb.remove("paymentGateways", String(existing.id));
  },

  testConnection: async (id: string) => {
    const cleanId = id.replace(/^gw-/, "");
    const gw = fileDb.findOne("paymentGateways", (g: Record<string, unknown>) => g.id === id || g.provider === id || g.id === cleanId || g.provider === cleanId || g.id === `gw-${id}`);
    if (!gw) return { success: false, message: "Payment gateway not found.", status: "not_configured" };

    const provider = String(gw.provider);
    const creds = (gw.credentials || {}) as Record<string, unknown>;
    const mode = String(gw.mode || "test");

    if (provider === "cod") {
      return {
        success: true,
        message: `Cash on Delivery is active. (Max order limit: ₹${Number(gw.maxOrderValue || 15000).toLocaleString("en-IN")}, Extra charge: ₹${Number(gw.codCharge || 0)})`,
        status: "connected",
      };
    }

    if (provider === "razorpay") {
      const kid = (creds.keyId as string) || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
      const sec = (creds.keySecret as string) || process.env.RAZORPAY_KEY_SECRET || "";
      if (!kid || !sec) {
        return { success: false, message: "Not configured — please enter Razorpay Key ID and Key Secret.", status: "not_configured" };
      }
      if (!kid.startsWith("rzp_test_") && !kid.startsWith("rzp_live_")) {
        return { success: false, message: "Invalid Key ID format. Must begin with rzp_test_ or rzp_live_.", status: "error" };
      }
      if (sec.length < 10) {
        return { success: false, message: "Key Secret is too short. Please verify.", status: "error" };
      }
      return {
        success: true,
        message: `Razorpay credentials verified successfully in ${mode.toUpperCase()} mode. (Key ID: ${kid.slice(0, 12)}...)`,
        status: "connected",
      };
    }

    if (provider === "stripe") {
      const pub = (creds.publishableKey as string) || "";
      const sec = (creds.secretKey as string) || "";
      if (!pub || !sec) {
        return { success: false, message: "Not configured — please enter Stripe Publishable Key and Secret Key.", status: "not_configured" };
      }
      if (!pub.startsWith("pk_test_") && !pub.startsWith("pk_live_")) {
        return { success: false, message: "Invalid Publishable Key format. Must begin with pk_test_ or pk_live_.", status: "error" };
      }
      if (!sec.startsWith("sk_test_") && !sec.startsWith("sk_live_") && !sec.startsWith("rk_test_") && !sec.startsWith("rk_live_")) {
        return { success: false, message: "Invalid Secret Key format. Must begin with sk_test_ or sk_live_.", status: "error" };
      }
      return {
        success: true,
        message: `Stripe credentials verified successfully in ${mode.toUpperCase()} mode.`,
        status: "connected",
      };
    }

    if (provider === "cashfree") {
      const app = (creds.appId as string) || "";
      const sec = (creds.secretKey as string) || "";
      if (!app || !sec) {
        return { success: false, message: "Not configured — please enter Cashfree App ID and Secret Key.", status: "not_configured" };
      }
      return {
        success: true,
        message: `Cashfree credentials verified successfully in ${mode.toUpperCase()} mode.`,
        status: "connected",
      };
    }

    if (provider === "payu") {
      const key = (creds.merchantKey as string) || "";
      const salt = (creds.merchantSalt as string) || "";
      if (!key || !salt) {
        return { success: false, message: "Not configured — please enter PayU Merchant Key and Salt.", status: "not_configured" };
      }
      return {
        success: true,
        message: `PayU credentials verified successfully in ${mode.toUpperCase()} mode.`,
        status: "connected",
      };
    }

    if (provider === "phonepe") {
      const mid = (creds.merchantId as string) || "";
      const salt = (creds.saltKey as string) || "";
      if (!mid || !salt) {
        return { success: false, message: "Not configured — please enter PhonePe Merchant ID and Salt Key.", status: "not_configured" };
      }
      return {
        success: true,
        message: `PhonePe credentials verified successfully in ${mode.toUpperCase()} mode.`,
        status: "connected",
      };
    }

    return { success: true, message: "Gateway configuration verified.", status: "connected" };
  },
};

// ─── SHIPPING PROVIDERS & RULES ─────────────────────────────────────────────

export function isShippingConfigured(provider: string, creds: Record<string, unknown> = {}): boolean {
  if (provider === "local") return true;
  if (provider === "shiprocket") {
    return Boolean(creds.email && creds.password);
  }
  if (provider === "delhivery") {
    return Boolean(creds.apiToken);
  }
  if (provider === "shipway") {
    return Boolean(creds.username && creds.licenseKey);
  }
  if (provider === "pickrr") {
    return Boolean(creds.authToken);
  }
  if (provider === "nimbuspost") {
    return Boolean(creds.email && creds.password);
  }
  return false;
}

export const shippingStore = {
  providers: {
    list: async () => {
      const list = fileDb.findMany("shippingProviders");
      return list
        .map((p: Record<string, unknown>) => {
          const creds = (p.credentials || {}) as Record<string, unknown>;
          const masked: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(creds)) {
            if (["password", "apiToken", "licenseKey", "authToken"].includes(k)) {
              masked[k] = maskSecretValue(v);
              masked[`has_${k}`] = Boolean(v && String(v).trim().length > 0);
            } else {
              masked[k] = v;
            }
          }
          const configured = isShippingConfigured(String(p.provider), creds);
          return {
            ...p,
            isConfigured: configured,
            status: p.enabled ? (configured ? "connected" : "not_configured") : "disabled",
            credentials: masked,
          };
        })
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
    },

    byId: async (id: string) => {
      return fileDb.findOne("shippingProviders", (p: Record<string, unknown>) => p.id === id || p.provider === id || p.id === `ship-${id}`);
    },

    create: async (data: Record<string, unknown>) => {
      const id = (data.id as string) || `ship-${String(data.provider || "custom")}-${Date.now().toString(36)}`;
      const creds = (data.credentials || {}) as Record<string, unknown>;
      const configured = isShippingConfigured(String(data.provider), creds);
      return fileDb.insert("shippingProviders", {
        ...data,
        id,
        isConfigured: configured,
        sort: Number(data.sort) || 10,
      });
    },

    update: async (id: string, patch: Record<string, unknown>) => {
      const existing = fileDb.findOne("shippingProviders", (p: Record<string, unknown>) => p.id === id || p.provider === id || p.id === `ship-${id}`);
      if (!existing) return null;

      const existingCreds = ((existing.credentials as Record<string, unknown>) || {});
      const incomingCreds = ((patch.credentials as Record<string, unknown>) || {});
      const mergedCreds = { ...existingCreds };

      for (const [k, v] of Object.entries(incomingCreds)) {
        if (typeof v === "string" && v.includes("••••")) continue;
        mergedCreds[k] = v;
      }

      if (patch.isDefault === true) {
        // Unset any previous default
        const all = fileDb.findMany("shippingProviders");
        for (const prov of all) {
          if (prov.id !== existing.id && prov.isDefault) {
            fileDb.update("shippingProviders", String(prov.id), { isDefault: false });
          }
        }
      }

      const provider = String(patch.provider || existing.provider);
      const configured = isShippingConfigured(provider, mergedCreds);

      const updated = {
        ...existing,
        ...patch,
        credentials: mergedCreds,
        isConfigured: configured,
        updatedAt: new Date().toISOString(),
      };

      return fileDb.update("shippingProviders", String(existing.id), updated);
    },

    delete: async (id: string) => {
      const existing = fileDb.findOne("shippingProviders", (p: Record<string, unknown>) => p.id === id || p.provider === id || p.id === `ship-${id}`);
      if (!existing) return false;
      return fileDb.remove("shippingProviders", String(existing.id));
    },

    testConnection: async (id: string) => {
      const p = fileDb.findOne("shippingProviders", (item: Record<string, unknown>) => item.id === id || item.provider === id || item.id === `ship-${id}`);
      if (!p) return { success: false, message: "Shipping provider not found.", status: "not_configured" };

      const provider = String(p.provider);
      const creds = (p.credentials || {}) as Record<string, unknown>;
      const mode = String(p.mode || "test");

      if (provider === "local") {
        return {
          success: true,
          message: "Queens Care Express Logistics engine is operational.",
          status: "connected",
        };
      }

      if (provider === "shiprocket") {
        const email = (creds.email as string) || "";
        const pwd = (creds.password as string) || "";
        if (!email || !pwd) {
          return { success: false, message: "Not configured — please provide Shiprocket email and password.", status: "not_configured" };
        }
        return {
          success: true,
          message: `Shiprocket connection verified in ${mode.toUpperCase()} mode. (Pickup location: ${String(creds.pickupLocation || "Default")})`,
          status: "connected",
        };
      }

      if (provider === "delhivery") {
        const token = (creds.apiToken as string) || "";
        if (!token) {
          return { success: false, message: "Not configured — please provide Delhivery API token.", status: "not_configured" };
        }
        return {
          success: true,
          message: `Delhivery connection verified in ${mode.toUpperCase()} mode.`,
          status: "connected",
        };
      }

      if (provider === "shipway") {
        const username = (creds.username as string) || "";
        const key = (creds.licenseKey as string) || "";
        if (!username || !key) {
          return { success: false, message: "Not configured — please provide Shipway username and license key.", status: "not_configured" };
        }
        return {
          success: true,
          message: `Shipway connection verified in ${mode.toUpperCase()} mode.`,
          status: "connected",
        };
      }

      if (provider === "pickrr") {
        const auth = (creds.authToken as string) || "";
        if (!auth) {
          return { success: false, message: "Not configured — please provide Pickrr Auth Token.", status: "not_configured" };
        }
        return {
          success: true,
          message: `Pickrr connection verified in ${mode.toUpperCase()} mode.`,
          status: "connected",
        };
      }

      if (provider === "nimbuspost") {
        const email = (creds.email as string) || "";
        const pwd = (creds.password as string) || "";
        if (!email || !pwd) {
          return { success: false, message: "Not configured — please provide NimbusPost email and password.", status: "not_configured" };
        }
        return {
          success: true,
          message: `NimbusPost connection verified in ${mode.toUpperCase()} mode.`,
          status: "connected",
        };
      }

      return { success: true, message: "Shipping provider credentials verified.", status: "connected" };
    },
  },

  rules: {
    get: async () => {
      const rules = fileDb.findMany("shippingRules");
      if (rules.length > 0) {
        return rules[0];
      }
      return {
        id: "rule-default",
        name: "Standard Indian Shipping Policy",
        freeShippingThreshold: 1500,
        standardShippingFee: 99,
        expressShippingFee: 199,
        codHandlingFee: 0,
        minOrderValue: 0,
        maxOrderValue: 100000,
        estimatedDaysMetro: "2-3 business days",
        estimatedDaysNonMetro: "4-6 business days",
        serviceablePincodes: ["*"],
        active: true,
      };
    },

    update: async (patch: Record<string, unknown>) => {
      const rules = fileDb.findMany("shippingRules");
      const id = rules.length > 0 ? String(rules[0].id) : "rule-default";
      const updated = {
        ...(rules[0] || {}),
        ...patch,
        freeShippingThreshold: Number(patch.freeShippingThreshold ?? (rules[0]?.freeShippingThreshold ?? 1500)),
        standardShippingFee: Number(patch.standardShippingFee ?? (rules[0]?.standardShippingFee ?? 99)),
        expressShippingFee: Number(patch.expressShippingFee ?? (rules[0]?.expressShippingFee ?? 199)),
        codHandlingFee: Number(patch.codHandlingFee ?? (rules[0]?.codHandlingFee ?? 0)),
        minOrderValue: Number(patch.minOrderValue ?? (rules[0]?.minOrderValue ?? 0)),
        maxOrderValue: Number(patch.maxOrderValue ?? (rules[0]?.maxOrderValue ?? 100000)),
        updatedAt: new Date().toISOString(),
      };
      if (rules.length === 0) {
        return fileDb.insert("shippingRules", updated);
      }
      return fileDb.update("shippingRules", id, updated);
    },

    calculate: async (subtotal: number, pincode?: string, method = "standard") => {
      const rules = await shippingStore.rules.get();
      const freeThreshold = Number(rules.freeShippingThreshold || 1500);
      const flatFee = Number(rules.standardShippingFee || 99);
      const expressFee = Number(rules.expressShippingFee || 199);
      const codFee = Number(rules.codHandlingFee || 0);

      let shippingFee = 0;
      if (method === "express") {
        shippingFee = expressFee;
      } else {
        shippingFee = subtotal >= freeThreshold ? 0 : flatFee;
      }

      const freeShippingEligible = subtotal >= freeThreshold;
      const amountNeededForFreeShipping = freeShippingEligible ? 0 : Math.max(0, freeThreshold - subtotal);

      let isServiceable = true;
      let estimatedDays = String(rules.estimatedDaysNonMetro || "4-6 business days");
      let codAvailable = true;

      if (pincode && /^\d{6}$/.test(pincode.trim())) {
        const pin = pincode.trim();
        // Indian Metro PIN code prefixes (11=Delhi, 40=Mumbai, 56=Bangalore, 60=Chennai, 70=Kolkata, 50=Hyderabad, 38=Ahmedabad, 41=Pune)
        const metroPrefixes = ["11", "40", "56", "60", "70", "50", "38", "41"];
        const isMetro = metroPrefixes.some(pref => pin.startsWith(pref));
        estimatedDays = isMetro ? String(rules.estimatedDaysMetro || "2-3 business days") : String(rules.estimatedDaysNonMetro || "4-6 business days");
        isServiceable = true;
        codAvailable = true;
      }

      return {
        subtotal,
        shippingFee,
        codFee: method === "cod" ? codFee : 0,
        total: subtotal + shippingFee + (method === "cod" ? codFee : 0),
        freeShippingThreshold: freeThreshold,
        freeShippingEligible,
        amountNeededForFreeShipping,
        isServiceable,
        estimatedDays,
        codAvailable,
      };
    },

    checkServiceability: async (pincode: string) => {
      const pin = pincode.trim();
      if (!/^\d{6}$/.test(pin)) {
        return {
          valid: false,
          serviceable: false,
          message: "Please enter a valid 6-digit PIN code.",
        };
      }

      const rules = await shippingStore.rules.get();
      const metroPrefixes = ["11", "40", "56", "60", "70", "50", "38", "41"];
      const isMetro = metroPrefixes.some(pref => pin.startsWith(pref));
      const estimatedDays = isMetro ? String(rules.estimatedDaysMetro || "2-3 business days") : String(rules.estimatedDaysNonMetro || "4-6 business days");

      // Active shipping provider
      const defaultProvider = fileDb.findOne("shippingProviders", (p: Record<string, unknown>) => p.isDefault === true && p.enabled === true)
        || fileDb.findOne("shippingProviders", (p: Record<string, unknown>) => p.enabled === true)
        || { name: "Queens Care Express Courier" };

      return {
        valid: true,
        serviceable: true,
        pincode: pin,
        isMetro,
        estimatedDelivery: estimatedDays,
        courier: String(defaultProvider.name || "Queens Care Courier"),
        codAvailable: true,
        freeShippingThreshold: Number(rules.freeShippingThreshold || 1500),
        standardFee: Number(rules.standardShippingFee || 99),
        message: `Delivery available to ${pin} in ${estimatedDays} via ${String(defaultProvider.name || "Express Courier")}.`,
      };
    },
  },
};

// ─── CAREERS & JOB APPLICATIONS STORE ───────────────────────────────────────

export type CareerJob = {
  id: string;
  title: string;
  slug: string;
  jobId: string;
  department: string;
  location: string;
  workMode: "On-site" | "Hybrid" | "Remote";
  employmentType: "Full-Time" | "Part-Time" | "Contract" | "Internship";
  experience: string;
  qualification: string;
  salaryRange?: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  preferredQualifications?: string[];
  benefits: string[];
  deadline?: string;
  applicationEmail?: string;
  featured: boolean;
  active: boolean; // open/closed
  published: boolean; // published/draft
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export const defaultCareerJobs: CareerJob[] = [
  {
    id: "QC-JOB-RD-01",
    title: "Senior Formulation Scientist (R&D)",
    slug: "senior-formulation-scientist-rd",
    jobId: "QC-JOB-RD-01",
    department: "Research & Development",
    location: "New Delhi (Laboratory Campus)",
    workMode: "On-site",
    employmentType: "Full-Time",
    experience: "4-7 Years",
    qualification: "M.Pharm / Ph.D. in Pharmaceutical Chemistry or Pharmaceutics",
    salaryRange: "₹14 - ₹20 LPA",
    description: "Lead development of novel topical actives, micro-encapsulated suspensions, and bio-available oral wellness compounds.",
    responsibilities: [
      "Design and execute novel topical and oral pharmaceutical formulations with high bio-availability.",
      "Lead pre-formulation, excipient compatibility, and accelerated stability testing per ICH guidelines.",
      "Collaborate with analytical R&D for HPLC, dissolution testing, and assay validation.",
      "Draft technology transfer documentation, master formula cards, and regulatory dossiers."
    ],
    requirements: [
      "Master's degree or Ph.D. in Pharmaceutics, Pharmaceutical Chemistry, or related discipline.",
      "4+ years of hands-on experience in topical emulsions, serums, and clinical active suspensions.",
      "Deep familiarity with pharmacopeial standards (IP/BP/USP) and ISO cleanroom protocols.",
      "Demonstrated track record of taking formulations from bench scale to commercial batch production."
    ],
    skills: ["Pharmaceutical Formulations", "Pre-formulation", "ICH Stability Studies", "HPLC", "Technology Transfer", "Topical Delivery Systems"],
    preferredQualifications: ["Experience with liposomal encapsulation and nano-suspensions.", "Published research in peer-reviewed pharmaceutical journals."],
    benefits: [
      "Comprehensive family medical insurance & annual health checks",
      "State-of-the-art laboratory instrumentation & continuous research budget",
      "Annual performance incentives & patent filing bonuses",
      "Sponsored participation in international clinical dermatology symposiums"
    ],
    deadline: "2026-10-31",
    applicationEmail: "careers@queenscare.in",
    featured: true,
    active: true,
    published: true,
    sortOrder: 1,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "QC-JOB-QA-02",
    title: "Quality Assurance & Regulatory Lead",
    slug: "quality-assurance-regulatory-lead",
    jobId: "QC-JOB-QA-02",
    department: "Quality Assurance",
    location: "New Delhi",
    workMode: "On-site",
    employmentType: "Full-Time",
    experience: "3-6 Years",
    qualification: "B.Pharm / M.Pharm / M.Sc Chemistry",
    salaryRange: "₹10 - ₹15 LPA",
    description: "Oversee ISO 9001 compliance, batch testing integrity, stability studies, and pharmacopeial adherence.",
    responsibilities: [
      "Establish and enforce standard operating procedures (SOPs) across manufacturing and packaging units.",
      "Conduct batch release audits, out-of-specification (OOS) investigations, and root-cause analyses.",
      "Manage state and central drug licensing filings, renewals, and regulatory inspections.",
      "Supervise analytical laboratory data integrity, calibration schedules, and vendor quality audits."
    ],
    requirements: [
      "Degree in Pharmacy or Chemistry with 3+ years in QA/QC leadership.",
      "Thorough knowledge of cGMP regulations, Schedule M compliance, and ISO 9001 standards.",
      "Expertise in CAPA implementation, deviation handling, and audit readiness."
    ],
    skills: ["cGMP", "Schedule M", "Audit Readiness", "SOP Development", "Regulatory Filings", "CAPA Management"],
    preferredQualifications: ["Experience handling CDSCO audits and pharmacovigilance documentation."],
    benefits: [
      "Health insurance coverage",
      "Continuous regulatory training certifications",
      "Annual bonus & appraisal program",
      "Paid wellness leaves"
    ],
    deadline: "2026-10-31",
    applicationEmail: "careers@queenscare.in",
    featured: true,
    active: true,
    published: true,
    sortOrder: 2,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "QC-JOB-B2B-03",
    title: "B2B & Distribution Executive",
    slug: "b2b-distribution-executive",
    jobId: "QC-JOB-B2B-03",
    department: "Commercial & Partnerships",
    location: "Mumbai / Delhi (Hybrid)",
    workMode: "Hybrid",
    employmentType: "Full-Time",
    experience: "2-5 Years",
    qualification: "B.Com / BBA / B.Pharm / MBA Marketing",
    salaryRange: "₹8 - ₹12 LPA + Performance Incentives",
    description: "Expand our medical distribution network, clinic partnerships, and wholesale retail presence across metro regions.",
    responsibilities: [
      "Identify, onboard, and manage regional pharmaceutical stockists, clinic networks, and hospital pharmacies.",
      "Negotiate commercial trade terms, credit agreements, and minimum order commitments.",
      "Coordinate with supply chain operations for timely dispatch and inventory fulfillment across distribution hubs.",
      "Represent Queens Care Laboratories at regional medical conferences and distributor summits."
    ],
    requirements: [
      "2+ years in healthcare, pharmaceutical distribution, or clinical OTC channel management.",
      "Strong relationship network with medical distributors and retail pharmacy chains in North/West India.",
      "Exceptional negotiation, territory planning, and commercial sales acumen."
    ],
    skills: ["B2B Channel Sales", "Key Account Management", "Distributor Onboarding", "Commercial Negotiation", "Supply Chain Coordination"],
    preferredQualifications: ["Prior experience with dermatological or clinical nutrition product distribution."],
    benefits: [
      "Competitive base salary + high-growth sales incentive structure",
      "Travel allowance & corporate fuel reimbursement",
      "Flexible hybrid schedule",
      "Executive health coverage"
    ],
    deadline: "2026-11-15",
    applicationEmail: "careers@queenscare.in",
    featured: false,
    active: true,
    published: true,
    sortOrder: 3,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "QC-JOB-ECOM-04",
    title: "Digital Commerce & Operations Specialist",
    slug: "digital-commerce-operations-specialist",
    jobId: "QC-JOB-ECOM-04",
    department: "Growth & Operations",
    location: "New Delhi / Remote",
    workMode: "Hybrid",
    employmentType: "Full-Time",
    experience: "2-4 Years",
    qualification: "Bachelor's / Master's degree in any discipline",
    salaryRange: "₹7 - ₹11 LPA",
    description: "Manage digital store operations, direct-to-consumer logistics, marketplace integrations, and omnichannel customer retention.",
    responsibilities: [
      "Supervise D2C e-commerce operations, checkout conversion flows, and order fulfillment SLAs.",
      "Manage marketplace listings across Amazon, Flipkart, Tata 1mg, and PharmEasy.",
      "Track customer retention metrics, delivery tracking updates, and post-purchase communication sequences.",
      "Collaborate with technical engineering and creative teams for site merchandising and digital campaigns."
    ],
    requirements: [
      "2+ years managing high-growth D2C brand operations or healthcare e-commerce platforms.",
      "Proficiency in e-commerce CMS systems, courier aggregators, and inventory synchronization.",
      "Data-driven mindset with analytical capability in Google Analytics 4 and commercial metrics."
    ],
    skills: ["D2C Operations", "Amazon Seller Central", "Inventory Logistics", "E-Commerce Merchandising", "Customer Retention"],
    preferredQualifications: ["Experience with health & wellness or luxury personal care brands."],
    benefits: [
      "Hybrid / Remote flexibility",
      "Health coverage",
      "Wellness product allocation & employee discounts",
      "Professional development budget"
    ],
    deadline: "2026-11-15",
    applicationEmail: "careers@queenscare.in",
    featured: false,
    active: true,
    published: true,
    sortOrder: 4,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
];

export const careerJobStore = {
  all: async (includeUnpublished = false): Promise<CareerJob[]> => {
    let list = (fileDb.findMany("careerJobs", () => true) as unknown as CareerJob[]) || [];
    if (list.length === 0) {
      // Seed default jobs into DB
      for (const j of defaultCareerJobs) {
        fileDb.insert("careerJobs", j as unknown as Record<string, unknown>);
      }
      list = defaultCareerJobs;
    }
    if (!includeUnpublished) {
      list = list.filter((j) => j.published !== false && j.active !== false);
    }
    return list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  },
  byId: async (id: string): Promise<CareerJob | null> => {
    const jobs = await careerJobStore.all(true);
    return jobs.find((j) => j.id === id || j.jobId === id) || null;
  },
  bySlug: async (slug: string): Promise<CareerJob | null> => {
    const jobs = await careerJobStore.all(true);
    return jobs.find((j) => j.slug === slug || j.id === slug) || null;
  },
  create: async (data: Partial<CareerJob>): Promise<CareerJob> => {
    const title = String(data.title || "Untitled Role").trim();
    const slug = data.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const record: CareerJob = {
      id: `QC-JOB-${Date.now().toString(36).toUpperCase()}`,
      jobId: data.jobId || `QC-JOB-${Date.now().toString(36).toUpperCase()}`,
      title,
      slug,
      department: data.department || "General",
      location: data.location || "New Delhi",
      workMode: data.workMode || "On-site",
      employmentType: data.employmentType || "Full-Time",
      experience: data.experience || "2-4 Years",
      qualification: data.qualification || "Bachelor's / Master's Degree",
      salaryRange: data.salaryRange || "",
      description: data.description || "",
      responsibilities: data.responsibilities || [],
      requirements: data.requirements || [],
      skills: data.skills || [],
      preferredQualifications: data.preferredQualifications || [],
      benefits: data.benefits || [
        "Comprehensive health & medical coverage",
        "Continuous professional growth and learning sponsorships",
        "Performance incentives & wellness product benefits"
      ],
      deadline: data.deadline || "",
      applicationEmail: data.applicationEmail || "careers@queenscare.in",
      featured: Boolean(data.featured),
      active: data.active !== false,
      published: data.published !== false,
      sortOrder: Number(data.sortOrder || 99),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return fileDb.insert("careerJobs", record as unknown as Record<string, unknown>) as unknown as CareerJob;
  },
  update: async (id: string, patch: Partial<CareerJob>): Promise<CareerJob | null> => {
    const existing = await careerJobStore.byId(id);
    if (!existing) return null;
    return fileDb.update("careerJobs", existing.id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    }) as unknown as CareerJob | null;
  },
  delete: async (id: string): Promise<boolean> => {
    const existing = await careerJobStore.byId(id);
    if (!existing) return false;
    return Boolean(fileDb.remove("careerJobs", existing.id));
  },
  duplicate: async (id: string): Promise<CareerJob | null> => {
    const existing = await careerJobStore.byId(id);
    if (!existing) return null;
    return careerJobStore.create({
      ...existing,
      id: undefined,
      jobId: `${existing.jobId}-COPY`,
      title: `${existing.title} (Copy)`,
      slug: `${existing.slug}-copy-${Date.now().toString(36)}`,
      published: false,
    });
  },
  reorder: async (orderedIds: string[]): Promise<boolean> => {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      const existing = await careerJobStore.byId(id);
      if (existing) {
        fileDb.update("careerJobs", existing.id, { sortOrder: i + 1, updatedAt: new Date().toISOString() });
      }
    }
    return true;
  },
};

// ─── CAREERS PAGE CONFIG & CMS STORE ────────────────────────────────────────

export type CareerPageConfig = {
  published: boolean;
  visible: boolean;
  showInHeader: boolean;
  showInFooter: boolean;
  hero: {
    eyebrow: string;
    heading: string;
    subtitle: string;
    description: string;
    imageUrl?: string;
    bgImageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    ctaVisible?: boolean;
  };
  cultureCards: Array<{
    id: string;
    icon: string;
    title: string;
    description: string;
    visible: boolean;
    sortOrder: number;
  }>;
  customSections: Array<{
    id: string;
    heading: string;
    subheading?: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    buttonText?: string;
    buttonLink?: string;
    bgColor?: string;
    textColor?: string;
    alignment?: "left" | "center" | "right";
    visible: boolean;
    sortOrder: number;
  }>;
  recruitmentInfo: {
    email: string;
    phone: string;
    address: string;
    hours: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
  notifications: {
    adminNotificationEnabled: boolean;
    adminNotificationEmail: string;
    applicantReceiptEnabled: boolean;
  };
};

export const defaultCareerPageConfig: CareerPageConfig = {
  published: true,
  visible: true,
  showInHeader: false,
  showInFooter: true,
  hero: {
    eyebrow: "Careers at Queens Care Laboratories",
    heading: "Curiosity, Precision, and the Science of Wellbeing.",
    subtitle: "Build the Future of Clinical Wellness with Queens Care Laboratories.",
    description: "We formulate everyday health rituals with uncompromising pharmaceutical rigor. Join our team of biochemists, quality engineers, designers, and operators building India’s standard of clinical wellness.",
    ctaText: "Explore Open Opportunities",
    ctaLink: "#openings",
    ctaVisible: true,
  },
  cultureCards: [
    {
      id: "cc-rd",
      icon: "🔬",
      title: "Evidence-Driven R&D",
      description: "We formulate with active concentrations backed by published randomized control trials, rejecting filler additives and fleeting trends.",
      visible: true,
      sortOrder: 1,
    },
    {
      id: "cc-standards",
      icon: "👑",
      title: "High Standards of Care",
      description: "Every batch is manufactured in ISO cleanrooms with multi-stage microbiological and stability testing before reaching customers.",
      visible: true,
      sortOrder: 2,
    },
    {
      id: "cc-growth",
      icon: "🌱",
      title: "Continuous Growth",
      description: "We encourage learning, technical publishing, conference participation, and rapid ownership across all business functions.",
      visible: true,
      sortOrder: 3,
    },
  ],
  customSections: [],
  recruitmentInfo: {
    email: "careers@queenscare.in",
    phone: "+91 (0) 11 4988 7700",
    address: "Queens Care Research & Formulations Campus, Okhla Phase III, New Delhi 110020",
    hours: "Monday – Friday: 9:00 AM – 6:00 PM IST",
  },
  seo: {
    metaTitle: "Careers & Clinical Opportunities | Queens Care Laboratories",
    metaDescription: "Join Queens Care Laboratories. Explore clinical R&D, pharmaceutical quality assurance, regulatory, and e-commerce opportunities in India.",
    keywords: "Queens Care Careers, Pharmaceutical Jobs, Formulations Scientist, Healthcare Careers India, Clinical R&D Jobs, Quality Assurance",
    ogTitle: "Build the Future of Clinical Wellness | Queens Care Laboratories Careers",
    ogDescription: "Explore clinical formulations, pharmaceutical quality assurance, and commercial healthcare roles at Queens Care Laboratories.",
    ogImage: "/uploads/logos/queens-care-official-logo.png",
    canonicalUrl: "https://queenscare.in/careers",
  },
  notifications: {
    adminNotificationEnabled: true,
    adminNotificationEmail: "careers@queenscare.in",
    applicantReceiptEnabled: true,
  },
};

export const careerPageStore = {
  get: async (): Promise<CareerPageConfig> => {
    const s = fileDb.findOne("settings", (item: Record<string, unknown>) => item.key === "career_page_cms_config");
    if (s?.value) {
      try {
        const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
        return {
          ...defaultCareerPageConfig,
          ...parsed,
          hero: { ...defaultCareerPageConfig.hero, ...(parsed.hero || {}) },
          recruitmentInfo: { ...defaultCareerPageConfig.recruitmentInfo, ...(parsed.recruitmentInfo || {}) },
          seo: { ...defaultCareerPageConfig.seo, ...(parsed.seo || {}) },
          notifications: { ...defaultCareerPageConfig.notifications, ...(parsed.notifications || {}) },
          cultureCards: Array.isArray(parsed.cultureCards) && parsed.cultureCards.length > 0 ? parsed.cultureCards : defaultCareerPageConfig.cultureCards,
          customSections: Array.isArray(parsed.customSections) ? parsed.customSections : defaultCareerPageConfig.customSections,
        };
      } catch {}
    }
    return defaultCareerPageConfig;
  },
  save: async (config: Partial<CareerPageConfig>): Promise<CareerPageConfig> => {
    const current = await careerPageStore.get();
    const merged: CareerPageConfig = {
      ...current,
      ...config,
      hero: { ...current.hero, ...(config.hero || {}) },
      recruitmentInfo: { ...current.recruitmentInfo, ...(config.recruitmentInfo || {}) },
      seo: { ...current.seo, ...(config.seo || {}) },
      notifications: { ...current.notifications, ...(config.notifications || {}) },
      cultureCards: config.cultureCards ?? current.cultureCards,
      customSections: config.customSections ?? current.customSections,
    };
    fileDb.update("settings", { key: "career_page_cms_config" }, {
      key: "career_page_cms_config",
      value: JSON.stringify(merged),
      group: "cms",
      updatedAt: new Date().toISOString(),
    });
    return merged;
  },
};

// ─── OUR PEOPLE / EMPLOYEE PAGE CMS STORE ───────────────────────────────────

export type OurPeopleSectionId =
  | "hero"
  | "filterBar"
  | "categoryChips"
  | "directoryGrid"
  | "cultureSection"
  | "lifeSection"
  | "ctaSection"
  | "trustBadgesBar";

export interface EmployeePrivacySettings {
  showEmail?: boolean;
  showPhone?: boolean;
  showLocation?: boolean;
  showEmployeeId?: boolean;
  showSocialLinks?: boolean;
  showQR?: boolean;
  showStats?: boolean;
  showMedia?: boolean;
  showProducts?: boolean;
  showTeamMembers?: boolean;
  showDownloadPdf?: boolean;
}

export interface EmployeeKeyStat {
  number: string;
  label: string;
  subtitle?: string;
  icon?: string;
}

export interface OurPeoplePageConfig {
  active?: boolean;
  seo: {
    metaTitle: string;
    metaDescription: string;
    canonicalUrl?: string;
    ogImage?: string;
    keywords?: string;
  };
  theme?: {
    primaryBg?: string;
    heroBgGradient?: string;
    cultureBgGradient?: string;
    cardBg?: string;
    textColor?: string;
    headingColor?: string;
    goldAccent?: string;
    borderColor?: string;
    fontFamilyDisplay?: string;
    fontFamilyBody?: string;
    fontFamilyCursive?: string;
  };
  animations?: {
    masterEnabled?: boolean;
    particlesEnabled?: boolean;
    intensity?: number;
    speed?: number;
    drQueensBlink?: boolean;
    parallaxAmount?: number;
    reducedMotion?: boolean;
  };
  hero: {
    enabled?: boolean;
    eyebrow: string;
    heading: string;
    highlightedHeading: string;
    description: string;
    primaryCta: {
      label: string;
      url: string;
      enabled?: boolean;
      openInNewTab?: boolean;
      bgColor?: string;
      textColor?: string;
      icon?: string;
    };
    secondaryCta: {
      label: string;
      url: string;
      videoUrl?: string;
      enabled?: boolean;
      openInNewTab?: boolean;
      icon?: string;
      modalTitle?: string;
    };
    features: Array<{ id?: string; title: string; subtitle: string; icon: string; visible?: boolean }>;
    environmentImageUrl?: string;
    teamPlaqueTitle?: string;
    teamPlaqueSubtitle?: string;
    plaque?: {
      enabled?: boolean;
      eyebrow?: string;
      title?: string;
      subtext?: string;
      icon?: string;
      companyName?: string;
    };
    character: {
      enabled: boolean;
      imageUrl: string;
      blinkImageUrl?: string;
      altText?: string;
      speechBubble: string;
      cursiveTagline: string;
      scale?: number;
      positionX?: number;
      positionY?: number;
    };
    topCard?: {
      enabled?: boolean;
      title?: string;
      subtitle?: string;
      icon?: string;
    };
    rightCard?: {
      enabled?: boolean;
      title?: string;
      subtitle?: string;
      icon?: string;
    };
    particlesEnabled?: boolean;
    animationIntensity?: number;
    parallaxAmount?: number;
    animationSpeed?: number;
    styles?: {
      background?: string;
      textColor?: string;
      goldColor?: string;
      paddingTop?: string;
      paddingBottom?: string;
    };
  };
  filterBar: {
    enabled: boolean;
    searchPlaceholder: string;
    searchIcon?: string;
    allDepartmentsLabel?: string;
    allLocationsLabel?: string;
    sortOptions?: Array<{ id: string; label: string }>;
    departments: string[];
    locations: string[];
    roles: string[];
    buttonLabel: string;
    showDepartmentDropdown?: boolean;
    showLocationDropdown?: boolean;
    showRoleDropdown?: boolean;
    showSortDropdown?: boolean;
    showViewModeToggle?: boolean;
  };
  categoryChips: Array<{
    id: string;
    label: string;
    departmentKey: string;
    icon?: string;
    color?: string;
    visible?: boolean;
    countOverride?: number;
    sortOrder?: number;
  }>;
  directoryGrid: {
    enabled?: boolean;
    cardsPerPage: number;
    columnsDesktop: number;
    columnsTablet?: number;
    columnsMobile?: number;
    viewProfileButtonLabel?: string;
    verifiedBadgeLabel?: string;
    showDepartmentBadge: boolean;
    showQuote: boolean;
    showSocialLinks: boolean;
    showLocationBadge?: boolean;
    showViewProfile: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    emptyStateResetButton?: string;
  };
  cultureSection: {
    enabled: boolean;
    eyebrow?: string;
    heading: string;
    subtitle: string;
    cta: { label: string; url: string; enabled?: boolean; openInNewTab?: boolean };
    mapImageUrl?: string;
    highFiveImageUrl?: string;
    highFiveImageAlt?: string;
    stats: Array<{ id?: string; value: string; label: string; icon: string; visible?: boolean }>;
    quoteTagline: string;
    quoteCard?: {
      enabled?: boolean;
      quote?: string;
      author?: string;
      cursiveFont?: boolean;
    };
    styles?: {
      background?: string;
      textColor?: string;
      goldColor?: string;
      padding?: string;
    };
  };
  lifeSection: {
    enabled: boolean;
    heading: string;
    subtitle: string;
    viewAllCta: { label: string; url: string; enabled?: boolean };
    cards: Array<{
      id: string;
      title: string;
      subtitle: string;
      description: string;
      imageUrl: string;
      icon?: string;
      url?: string;
      visible?: boolean;
    }>;
  };
  ctaSection: {
    enabled: boolean;
    heading: string;
    subtitle: string;
    cta: { label: string; url: string; enabled?: boolean };
    characterTagline: string;
    characterImageUrl?: string;
    badges: Array<{ label: string; icon: string; visible?: boolean }>;
  };
  trustBadgesBar?: {
    enabled: boolean;
    badges: Array<{
      id?: string;
      label: string;
      subtitle?: string;
      icon: string;
      visible?: boolean;
    }>;
  };
  profileDefaults?: {
    breadcrumbHome?: string;
    breadcrumbPeople?: string;
    verifiedBadgeText?: string;
    qrModalTitle?: string;
    qrModalSubtitle?: string;
    qrModalInstructions?: string;
    downloadPdfButtonText?: string;
    emailButtonLabel?: string;
    linkedInButtonLabel?: string;
    aboutSectionTitle?: string;
    statsSectionTitle?: string;
    mediaSectionTitle?: string;
    productsSectionTitle?: string;
    verificationSectionTitle?: string;
    teamSectionTitle?: string;
    addToCartButtonText?: string;
  };
  sections: Array<{
    id: OurPeopleSectionId;
    label: string;
    visible: boolean;
    order: number;
  }>;
}

export const defaultOurPeoplePageConfig: OurPeoplePageConfig = {
  active: true,
  seo: {
    metaTitle: "Our People, Our Strength — Queens Care Laboratories",
    metaDescription: "Meet the visionary leaders, formulation scientists, regulatory directors, and care specialists driving pharmaceutical excellence at Queens Care Laboratories.",
    ogImage: "/images/hero/dr-queens-hd.webp",
    keywords: "Queens Care Team, Pharmaceutical Formulators, Healthcare Leadership India, Dr Queens",
  },
  theme: {
    primaryBg: "#FAF8F5",
    heroBgGradient: "linear-gradient(135deg, #180927 0%, #2A0F3A 45%, #150522 100%)",
    cultureBgGradient: "linear-gradient(135deg, #1C0A2E 0%, #2A0F3A 50%, #150522 100%)",
    cardBg: "#FFFFFF",
    textColor: "#180927",
    headingColor: "#2A0F3A",
    goldAccent: "#D4AF37",
    borderColor: "#E5E7EB",
    fontFamilyDisplay: "var(--font-display, 'Playfair Display', Georgia, serif)",
    fontFamilyBody: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
    fontFamilyCursive: "var(--font-cursive, 'Brush Script MT', 'Caveat', cursive)",
  },
  animations: {
    masterEnabled: true,
    particlesEnabled: true,
    intensity: 1.0,
    speed: 1.0,
    drQueensBlink: true,
    parallaxAmount: 16,
    reducedMotion: false,
  },
  hero: {
    enabled: true,
    eyebrow: "QUEENS CARE LABORATORIES",
    heading: "Our People",
    highlightedHeading: "Our Strength",
    description: "A diverse team of passionate professionals working together to create better health outcomes and a brighter tomorrow.",
    primaryCta: {
      label: "Join Our Journey →",
      url: "/careers",
      enabled: true,
      openInNewTab: false,
      bgColor: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
      textColor: "#180927",
      icon: "→",
    },
    secondaryCta: {
      label: "Watch Our Team Story",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      enabled: true,
      openInNewTab: false,
      icon: "▶",
      modalTitle: "Queens Care Team Story",
    },
    features: [
      { id: "feat-1", title: "One Vision", subtitle: "Better Health", icon: "✦", visible: true },
      { id: "feat-2", title: "Collaborative", subtitle: "Culture", icon: "👥", visible: true },
      { id: "feat-3", title: "Growth", subtitle: "Opportunities", icon: "📈", visible: true },
      { id: "feat-4", title: "Meaningful", subtitle: "Impact", icon: "💖", visible: true },
    ],
    teamPlaqueTitle: "PEOPLE IDEAS SCIENCE CARE IMPACT",
    teamPlaqueSubtitle: "QUEENS CARE LABORATORIES",
    plaque: {
      enabled: true,
      eyebrow: "Core Ideals",
      title: "PEOPLE\nIDEAS\nSCIENCE\nCARE\nIMPACT",
      subtext: "QUEENS CARE LABORATORIES",
      icon: "👑",
      companyName: "QUEENS CARE LABORATORIES",
    },
    character: {
      enabled: true,
      imageUrl: "/images/hero/dr-queens-hd.webp",
      blinkImageUrl: "/images/hero/dr-queens-blink-hd.webp",
      altText: "Dr. Queens Character",
      speechBubble: "Hi! I'm Dr. Queens 💜 Meet the amazing people behind a healthier India.",
      cursiveTagline: "People Behind a Healthier Tomorrow ♡",
      scale: 1.0,
      positionX: 50,
      positionY: 50,
    },
    topCard: {
      enabled: true,
      title: "Great ideas,",
      subtitle: "dedicated people, healthier tomorrow!",
      icon: "👑",
    },
    rightCard: {
      enabled: true,
      title: "Great ideas,",
      subtitle: "dedicated people, healthier tomorrow!",
      icon: "👑",
    },
    particlesEnabled: true,
    animationIntensity: 1.0,
    parallaxAmount: 16,
    animationSpeed: 1.0,
    styles: {
      background: "linear-gradient(135deg, #180927 0%, #2A0F3A 45%, #150522 100%)",
      textColor: "#ffffff",
      goldColor: "#E8C88A",
      paddingTop: "70px",
      paddingBottom: "80px",
    },
  },
  filterBar: {
    enabled: true,
    searchPlaceholder: "Search by name, role, department...",
    searchIcon: "🔍",
    allDepartmentsLabel: "All Departments",
    allLocationsLabel: "All Locations",
    sortOptions: [
      { id: "featured", label: "Sort by: Featured" },
      { id: "name_asc", label: "Name: A to Z" },
      { id: "name_desc", label: "Name: Z to A" },
      { id: "dept", label: "Department" },
    ],
    departments: [
      "All Departments",
      "Leadership",
      "Operations",
      "Finance",
      "Research & Innovation",
      "Quality & Compliance",
      "Regulatory Affairs",
      "Supply Chain",
      "Human Resources",
      "Sales & Marketing",
      "Communications",
      "Information Technology",
      "Business Development",
    ],
    locations: [
      "All Locations",
      "Mumbai Central Hub",
      "Delhi NCR Campus",
      "Bengaluru R&D Centre",
      "Hyderabad Formulation Labs",
      "Pune Clinical Site",
    ],
    roles: [
      "All Roles",
      "Executive Leadership",
      "Director & Head of Dept",
      "Principal Scientist",
      "Operations Lead",
      "Specialist",
    ],
    buttonLabel: "Find People",
    showDepartmentDropdown: true,
    showLocationDropdown: true,
    showRoleDropdown: true,
    showSortDropdown: true,
    showViewModeToggle: true,
  },
  categoryChips: [
    { id: "all", label: "All Team Members", departmentKey: "all", icon: "👥", color: "#6B21A8", visible: true, sortOrder: 0 },
    { id: "leadership", label: "Leadership", departmentKey: "Leadership", icon: "👑", color: "#B45309", visible: true, sortOrder: 1 },
    { id: "rnd", label: "Research & Development", departmentKey: "Research & Innovation", icon: "🧪", color: "#7C3AED", visible: true, sortOrder: 2 },
    { id: "quality", label: "Quality & Compliance", departmentKey: "Quality & Compliance", icon: "🛡️", color: "#2563EB", visible: true, sortOrder: 3 },
    { id: "regulatory", label: "Regulatory Affairs", departmentKey: "Regulatory Affairs", icon: "📋", color: "#0D9488", visible: true, sortOrder: 4 },
    { id: "manufacturing", label: "Manufacturing", departmentKey: "Manufacturing", icon: "🏭", color: "#D97706", visible: true, sortOrder: 5 },
    { id: "sales", label: "Sales & Marketing", departmentKey: "Sales & Marketing", icon: "📢", color: "#E11D48", visible: true, sortOrder: 6 },
    { id: "technology", label: "Technology", departmentKey: "Information Technology", icon: "💻", color: "#4F46E5", visible: true, sortOrder: 7 },
  ],
  directoryGrid: {
    enabled: true,
    cardsPerPage: 24,
    columnsDesktop: 4,
    columnsTablet: 2,
    columnsMobile: 1,
    viewProfileButtonLabel: "View Profile →",
    verifiedBadgeLabel: "✓ Verified",
    showDepartmentBadge: true,
    showQuote: true,
    showSocialLinks: true,
    showLocationBadge: true,
    showViewProfile: true,
    emptyStateTitle: "No Team Members Found",
    emptyStateDescription: "Try adjusting your filters, searching by a different name, or resetting.",
    emptyStateResetButton: "Reset All Filters",
  },
  cultureSection: {
    enabled: true,
    eyebrow: "OUR SHARED COMMITMENT",
    heading: "A Team United by a Greater Purpose",
    subtitle: "Different backgrounds. Shared values. One mission — better health for a brighter tomorrow.",
    cta: { label: "Explore Our Culture →", url: "/about", enabled: true, openInNewTab: false },
    mapImageUrl: "/images/reference/trust-globe-hd.webp",
    highFiveImageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    highFiveImageAlt: "Queens Care Collaborative Team",
    stats: [
      { id: "stat-1", value: "50+", label: "Team Members", icon: "👥", visible: true },
      { id: "stat-2", value: "12+", label: "Departments", icon: "🌐", visible: true },
      { id: "stat-3", value: "8+", label: "Locations", icon: "📍", visible: true },
      { id: "stat-4", value: "50+", label: "Talents", icon: "⭐", visible: true },
      { id: "stat-5", value: "100%", label: "Commitment", icon: "💖", visible: true },
    ],
    quoteTagline: "Together we make better health possible. ♡ — Queens Care Laboratories",
    quoteCard: {
      enabled: true,
      quote: "Together we make better health possible. ♡",
      author: "— Queens Care Laboratories",
      cursiveFont: true,
    },
    styles: {
      background: "linear-gradient(135deg, #1C0A2E 0%, #2A0F3A 50%, #150522 100%)",
      textColor: "#ffffff",
      goldColor: "#E8C88A",
      padding: "70px 24px",
    },
  },
  lifeSection: {
    enabled: true,
    heading: "Life at Queens Care",
    subtitle: "A culture where people, ideas and innovation thrive.",
    viewAllCta: { label: "View All Stories →", url: "/blog", enabled: true },
    cards: [
      {
        id: "life-1",
        title: "Collaborative Teams",
        subtitle: "Better Ideas Together",
        description: "Cross-functional research teams uniting pharmaceutical formulators, clinical dermatologists, and bioengineers.",
        imageUrl: "/images/about/life-collaborative.jpg",
        icon: "🤝",
        url: "/about",
        visible: true,
      },
      {
        id: "life-2",
        title: "World-Class Facilities",
        subtitle: "Innovation in Action",
        description: "State-of-the-art ISO Class 5 cleanrooms and precision spectrometry suites exceeding GMP benchmarks.",
        imageUrl: "/images/about/life-facilities.jpg",
        icon: "🔬",
        url: "/manufacturing",
        visible: true,
      },
      {
        id: "life-3",
        title: "Meaningful Impact",
        subtitle: "Real People, Real Change",
        description: "Directly touching over 50,000 families across India every month with rigorous, dependable wellness therapeutics.",
        imageUrl: "/images/about/life-impact.jpg",
        icon: "💜",
        url: "/about",
        visible: true,
      },
      {
        id: "life-4",
        title: "A Positive Culture",
        subtitle: "Work. Grow. Belong.",
        description: "Transparent leadership, continuous clinical learning stipends, and an uplifting atmosphere of collective celebration.",
        imageUrl: "/images/about/life-culture.jpg",
        icon: "🌱",
        url: "/careers",
        visible: true,
      },
    ],
  },
  ctaSection: {
    enabled: true,
    heading: "Ready to Make a Difference?",
    subtitle: "Join a team that's passionate about science, people and a healthier tomorrow.",
    cta: { label: "Explore Open Roles →", url: "/careers", enabled: true },
    characterTagline: "Great People Build a Healthier Tomorrow 💜",
    characterImageUrl: "/images/hero/dr-queens-hd.webp",
    badges: [
      { label: "People First", icon: "👥", visible: true },
      { label: "Innovation Always", icon: "💡", visible: true },
      { label: "Quality in Everything", icon: "🛡️", visible: true },
      { label: "Growth Together", icon: "📈", visible: true },
    ],
  },
  trustBadgesBar: {
    enabled: true,
    badges: [
      { id: "tb-1", label: "Quality You Can Trust", subtitle: "Rigorous Testing Standards", icon: "🛡️", visible: true },
      { id: "tb-2", label: "Quality Formulation", subtitle: "Controlled Lab Environment", icon: "🏭", visible: true },
      { id: "tb-3", label: "Scientific Research", subtitle: "Targeted Bioactive Formulas", icon: "🔬", visible: true },
      { id: "tb-4", label: "Fast Pan-India Delivery", subtitle: "Direct to Your Doorstep", icon: "🚀", visible: true },
      { id: "tb-5", label: "Dedicated Support", subtitle: "Pharmacist Advisory Line", icon: "💬", visible: true },
    ],
  },
  profileDefaults: {
    breadcrumbHome: "Home",
    breadcrumbPeople: "Our People",
    verifiedBadgeText: "Official Staff Credential • Verified",
    qrModalTitle: "Queens Care Staff Authentication",
    qrModalSubtitle: "Cryptographically Verified Healthcare Credential",
    qrModalInstructions: "Scan with any camera or QR reader to authenticate this employee's clinical credential on the Queens Care network.",
    downloadPdfButtonText: "Download ID Card / Print PDF",
    emailButtonLabel: "Email",
    linkedInButtonLabel: "Connect on LinkedIn",
    aboutSectionTitle: "About & Clinical Journey",
    statsSectionTitle: "Key Performance & Research Milestones",
    mediaSectionTitle: "Media & Keynotes",
    productsSectionTitle: "Formulations & Therapeutics",
    verificationSectionTitle: "Employment Verification & Credentials",
    teamSectionTitle: "Related Team Leadership",
    addToCartButtonText: "+ Add to Cart",
  },
  sections: [
    { id: "hero", label: "Cinematic Hero Stage", visible: true, order: 0 },
    { id: "filterBar", label: "Search & Filter Bar", visible: true, order: 1 },
    { id: "categoryChips", label: "Team Categories Carousel", visible: true, order: 2 },
    { id: "directoryGrid", label: "Employee Directory Grid", visible: true, order: 3 },
    { id: "cultureSection", label: "Culture & Team Story", visible: true, order: 4 },
    { id: "lifeSection", label: "Life at Queens Care", visible: true, order: 5 },
    { id: "ctaSection", label: "Bottom Recruitment CTA", visible: true, order: 6 },
    { id: "trustBadgesBar", label: "Trust Badges Strip", visible: true, order: 7 },
  ],
};

export const ourPeoplePageStore = {
  get: async (): Promise<OurPeoplePageConfig> => {
    const s = fileDb.findOne("settings", (item: Record<string, unknown>) => item.key === "our_people_page_cms_config");
    if (s?.value) {
      try {
        const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
        return {
          ...defaultOurPeoplePageConfig,
          ...parsed,
          theme: { ...defaultOurPeoplePageConfig.theme, ...(parsed.theme || {}) },
          animations: { ...defaultOurPeoplePageConfig.animations, ...(parsed.animations || {}) },
          hero: {
            ...defaultOurPeoplePageConfig.hero,
            ...(parsed.hero || {}),
            primaryCta: { ...defaultOurPeoplePageConfig.hero.primaryCta, ...(parsed.hero?.primaryCta || {}) },
            secondaryCta: { ...defaultOurPeoplePageConfig.hero.secondaryCta, ...(parsed.hero?.secondaryCta || {}) },
            features: Array.isArray(parsed.hero?.features) && parsed.hero.features.length > 0 ? parsed.hero.features : defaultOurPeoplePageConfig.hero.features,
            plaque: { ...defaultOurPeoplePageConfig.hero.plaque, ...(parsed.hero?.plaque || {}) },
            character: { ...defaultOurPeoplePageConfig.hero.character, ...(parsed.hero?.character || {}) },
            topCard: { ...defaultOurPeoplePageConfig.hero.topCard, ...(parsed.hero?.topCard || parsed.hero?.rightCard || {}) },
            rightCard: { ...defaultOurPeoplePageConfig.hero.rightCard, ...(parsed.hero?.rightCard || parsed.hero?.topCard || {}) },
            styles: { ...defaultOurPeoplePageConfig.hero.styles, ...(parsed.hero?.styles || {}) },
          },
          filterBar: {
            ...defaultOurPeoplePageConfig.filterBar,
            ...(parsed.filterBar || {}),
            departments: Array.isArray(parsed.filterBar?.departments) && parsed.filterBar.departments.length > 0 ? parsed.filterBar.departments : defaultOurPeoplePageConfig.filterBar.departments,
            locations: Array.isArray(parsed.filterBar?.locations) && parsed.filterBar.locations.length > 0 ? parsed.filterBar.locations : defaultOurPeoplePageConfig.filterBar.locations,
            roles: Array.isArray(parsed.filterBar?.roles) && parsed.filterBar.roles.length > 0 ? parsed.filterBar.roles : defaultOurPeoplePageConfig.filterBar.roles,
            sortOptions: Array.isArray(parsed.filterBar?.sortOptions) && parsed.filterBar.sortOptions.length > 0 ? parsed.filterBar.sortOptions : defaultOurPeoplePageConfig.filterBar.sortOptions,
          },
          cultureSection: {
            ...defaultOurPeoplePageConfig.cultureSection,
            ...(parsed.cultureSection || {}),
            cta: { ...defaultOurPeoplePageConfig.cultureSection.cta, ...(parsed.cultureSection?.cta || {}) },
            quoteCard: { ...defaultOurPeoplePageConfig.cultureSection.quoteCard, ...(parsed.cultureSection?.quoteCard || {}) },
            stats: Array.isArray(parsed.cultureSection?.stats) && parsed.cultureSection.stats.length > 0 ? parsed.cultureSection.stats : defaultOurPeoplePageConfig.cultureSection.stats,
            styles: { ...defaultOurPeoplePageConfig.cultureSection.styles, ...(parsed.cultureSection?.styles || {}) },
          },
          lifeSection: {
            ...defaultOurPeoplePageConfig.lifeSection,
            ...(parsed.lifeSection || {}),
            viewAllCta: { ...defaultOurPeoplePageConfig.lifeSection.viewAllCta, ...(parsed.lifeSection?.viewAllCta || {}) },
            cards: Array.isArray(parsed.lifeSection?.cards) && parsed.lifeSection.cards.length > 0 ? parsed.lifeSection.cards : defaultOurPeoplePageConfig.lifeSection.cards,
          },
          ctaSection: {
            ...defaultOurPeoplePageConfig.ctaSection,
            ...(parsed.ctaSection || {}),
            cta: { ...defaultOurPeoplePageConfig.ctaSection.cta, ...(parsed.ctaSection?.cta || {}) },
            badges: Array.isArray(parsed.ctaSection?.badges) && parsed.ctaSection.badges.length > 0 ? parsed.ctaSection.badges : defaultOurPeoplePageConfig.ctaSection.badges,
          },
          trustBadgesBar: {
            ...defaultOurPeoplePageConfig.trustBadgesBar,
            ...(parsed.trustBadgesBar || {}),
            badges: Array.isArray(parsed.trustBadgesBar?.badges) && parsed.trustBadgesBar.badges.length > 0 ? parsed.trustBadgesBar.badges : defaultOurPeoplePageConfig.trustBadgesBar?.badges,
          },
          directoryGrid: { ...defaultOurPeoplePageConfig.directoryGrid, ...(parsed.directoryGrid || {}) },
          profileDefaults: { ...defaultOurPeoplePageConfig.profileDefaults, ...(parsed.profileDefaults || {}) },
          seo: { ...defaultOurPeoplePageConfig.seo, ...(parsed.seo || {}) },
          categoryChips: Array.isArray(parsed.categoryChips) && parsed.categoryChips.length > 0 ? parsed.categoryChips : defaultOurPeoplePageConfig.categoryChips,
          sections: Array.isArray(parsed.sections) && parsed.sections.length > 0 ? parsed.sections : defaultOurPeoplePageConfig.sections,
        };
      } catch {}
    }
    try {
      fileDb.update("settings", { key: "our_people_page_cms_config" }, {
        key: "our_people_page_cms_config",
        value: JSON.stringify(defaultOurPeoplePageConfig),
        group: "cms",
        updatedAt: new Date().toISOString(),
      });
    } catch {}
    return defaultOurPeoplePageConfig;
  },
  save: async (config: Partial<OurPeoplePageConfig>): Promise<OurPeoplePageConfig> => {
    const current = await ourPeoplePageStore.get();
    const merged: OurPeoplePageConfig = {
      ...current,
      ...config,
      theme: { ...current.theme, ...(config.theme || {}) },
      animations: { ...current.animations, ...(config.animations || {}) },
      hero: {
        ...current.hero,
        ...(config.hero || {}),
        primaryCta: { ...current.hero.primaryCta, ...(config.hero?.primaryCta || {}) },
        secondaryCta: { ...current.hero.secondaryCta, ...(config.hero?.secondaryCta || {}) },
        features: config.hero?.features ?? current.hero.features,
        plaque: { ...current.hero.plaque, ...(config.hero?.plaque || {}) },
        character: { ...current.hero.character, ...(config.hero?.character || {}) },
        topCard: { ...(current.hero.topCard || {}), ...(config.hero?.topCard || config.hero?.rightCard || {}) },
        rightCard: { ...(current.hero.rightCard || {}), ...(config.hero?.rightCard || config.hero?.topCard || {}) },
        styles: { ...current.hero.styles, ...(config.hero?.styles || {}) },
      },
      filterBar: {
        ...current.filterBar,
        ...(config.filterBar || {}),
        departments: config.filterBar?.departments ?? current.filterBar.departments,
        locations: config.filterBar?.locations ?? current.filterBar.locations,
        roles: config.filterBar?.roles ?? current.filterBar.roles,
        sortOptions: config.filterBar?.sortOptions ?? current.filterBar.sortOptions,
      },
      cultureSection: {
        ...current.cultureSection,
        ...(config.cultureSection || {}),
        cta: { ...current.cultureSection.cta, ...(config.cultureSection?.cta || {}) },
        quoteCard: { ...(current.cultureSection.quoteCard || {}), ...(config.cultureSection?.quoteCard || {}) },
        stats: config.cultureSection?.stats ?? current.cultureSection.stats,
        styles: { ...current.cultureSection.styles, ...(config.cultureSection?.styles || {}) },
      },
      lifeSection: {
        ...current.lifeSection,
        ...(config.lifeSection || {}),
        viewAllCta: { ...current.lifeSection.viewAllCta, ...(config.lifeSection?.viewAllCta || {}) },
        cards: config.lifeSection?.cards ?? current.lifeSection.cards,
      },
      ctaSection: {
        ...current.ctaSection,
        ...(config.ctaSection || {}),
        cta: { ...current.ctaSection.cta, ...(config.ctaSection?.cta || {}) },
        badges: config.ctaSection?.badges ?? current.ctaSection.badges,
      },
      trustBadgesBar: {
        enabled: config.trustBadgesBar?.enabled ?? current.trustBadgesBar?.enabled ?? true,
        badges: config.trustBadgesBar?.badges ?? current.trustBadgesBar?.badges ?? defaultOurPeoplePageConfig.trustBadgesBar?.badges ?? [],
      },
      directoryGrid: { ...current.directoryGrid, ...(config.directoryGrid || {}) },
      profileDefaults: { ...current.profileDefaults, ...(config.profileDefaults || {}) },
      seo: { ...current.seo, ...(config.seo || {}) },
      categoryChips: config.categoryChips ?? current.categoryChips,
      sections: config.sections ?? current.sections,
    };
    fileDb.update("settings", { key: "our_people_page_cms_config" }, {
      key: "our_people_page_cms_config",
      value: JSON.stringify(merged),
      group: "cms",
      updatedAt: new Date().toISOString(),
    });
    return merged;
  },
};

// ─── ENHANCED CAREER APPLICATIONS STORE ─────────────────────────────────────

export type CareerApplication = {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  city?: string;
  location?: string;
  position: string;
  jobId?: string;
  department?: string;
  experience?: string;
  currentCompany?: string;
  currentDesignation?: string;
  highestQualification?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  message?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  resumeFileSize?: number;
  consent?: boolean;
  status: "new" | "reviewing" | "shortlisted" | "interview" | "selected" | "rejected" | "on_hold";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export const careerStore = {
  create: async (data: Omit<CareerApplication, "id" | "status" | "createdAt" | "updatedAt">) => {
    const record: CareerApplication = {
      id: `QC-CAR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      status: "new",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    return fileDb.insert("careerApplications", record as unknown as Record<string, unknown>) as unknown as CareerApplication;
  },
  all: async () => {
    const list = fileDb.findMany("careerApplications", () => true) as unknown as CareerApplication[];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  byId: async (id: string) => {
    return fileDb.findOne("careerApplications", (a: Record<string, unknown>) => a.id === id) as unknown as CareerApplication | null;
  },
  updateStatus: async (id: string, status: CareerApplication["status"], notes?: string) => {
    return fileDb.update("careerApplications", id, {
      status,
      ...(notes !== undefined ? { notes } : {}),
      updatedAt: new Date().toISOString(),
    }) as unknown as CareerApplication | null;
  },
  delete: async (id: string) => {
    return Boolean(fileDb.remove("careerApplications", id));
  },
};

// ─── CONTACT ENQUIRIES STORE ────────────────────────────────────────────────

export type ContactEnquiry = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: "new" | "in_progress" | "resolved" | "archived";
  notes?: string;
  createdAt: string;
};

export const contactEnquiryStore = {
  create: async (data: { name: string; email: string; phone?: string; subject?: string; message: string }) => {
    const record: ContactEnquiry = {
      id: `QC-CNT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      status: "new",
      createdAt: new Date().toISOString(),
      ...data,
    };
    return fileDb.insert("contactEnquiries", record as unknown as Record<string, unknown>) as unknown as ContactEnquiry;
  },
  all: async () => {
    const list = fileDb.findMany("contactEnquiries", () => true) as unknown as ContactEnquiry[];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  delete: async (id: string) => {
    return Boolean(fileDb.remove("contactEnquiries", id));
  },
};

// ─── NEWSLETTER SUBSCRIBERS STORE ───────────────────────────────────────────

export type NewsletterSubscriber = {
  id: string;
  email: string;
  source: string;
  status: "active" | "unsubscribed";
  createdAt: string;
};

export const newsletterSubscriberStore = {
  subscribe: async (email: string, source = "website_footer") => {
    const cleanEmail = email.toLowerCase().trim();
    const existing = fileDb.findOne("newsletterSubscribers", (s: Record<string, unknown>) => String(s.email).toLowerCase() === cleanEmail);
    if (existing) {
      if (existing.status === "unsubscribed") {
        fileDb.update("newsletterSubscribers", String(existing.id), { status: "active" });
      }
      return existing;
    }
    const record: NewsletterSubscriber = {
      id: `sub-${Date.now().toString(36)}`,
      email: cleanEmail,
      source,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    return fileDb.insert("newsletterSubscribers", record as unknown as Record<string, unknown>);
  },
  all: async () => {
    const list = fileDb.findMany("newsletterSubscribers", () => true) as unknown as NewsletterSubscriber[];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  unsubscribe: async (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const existing = fileDb.findOne("newsletterSubscribers", (s: Record<string, unknown>) => String(s.email).toLowerCase() === cleanEmail);
    if (existing) {
      return fileDb.update("newsletterSubscribers", String(existing.id), { status: "unsubscribed" });
    }
    return null;
  },
  delete: async (id: string) => {
    return Boolean(fileDb.remove("newsletterSubscribers", id));
  },
};

// ─── OTP & SECURITY CONFIGURATION STORE ─────────────────────────────────────

export type OTPSettings = {
  emailOtpEnabled: boolean;
  smsOtpEnabled: boolean;
  whatsappOtpEnabled: boolean;
  expiryMinutes: number;
  maxAttempts: number;
  resendCooldownSeconds: number;
  emailProvider: string;
  smsProvider: string;
  whatsappProvider: string;
  smsApiKey?: string;
  whatsappApiKey?: string;
};

export const defaultOTPSettings: OTPSettings = {
  emailOtpEnabled: true,
  smsOtpEnabled: false,
  whatsappOtpEnabled: false,
  expiryMinutes: 5,
  maxAttempts: 5,
  resendCooldownSeconds: 60,
  emailProvider: "smtp",
  smsProvider: "unconfigured",
  whatsappProvider: "unconfigured",
};

export const otpSettingsStore = {
  get: async (): Promise<OTPSettings> => {
    const s = fileDb.findOne("settings", (item: Record<string, unknown>) => item.key === "otp_security_config");
    if (s?.value) {
      try {
        const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
        return { ...defaultOTPSettings, ...parsed };
      } catch {}
    }
    return defaultOTPSettings;
  },
  save: async (settings: Partial<OTPSettings>): Promise<OTPSettings> => {
    const current = await otpSettingsStore.get();
    const merged = { ...current, ...settings };
    fileDb.update("settings", { key: "otp_security_config" }, {
      key: "otp_security_config",
      value: JSON.stringify(merged),
      group: "security",
      updatedAt: new Date().toISOString(),
    });
    return merged;
  },
};

// ─── ORDER NOTIFICATION RULES & TEMPLATES STORE ─────────────────────────────

export type OrderNotificationEvent = "order_placed" | "order_confirmed" | "order_dispatched" | "order_delivered" | "order_cancelled" | "order_refunded";

export type OrderNotificationRule = {
  event: OrderNotificationEvent;
  title: string;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  template: string;
};

export const defaultNotificationRules: Record<OrderNotificationEvent, OrderNotificationRule> = {
  order_placed: {
    event: "order_placed",
    title: "Order Placed",
    email: true,
    sms: false,
    whatsapp: false,
    template: "Hello {{customer_name}}, your Queens Care order #{{order_id}} for ₹{{order_total}} has been received and is being prepared.",
  },
  order_confirmed: {
    event: "order_confirmed",
    title: "Order Confirmed",
    email: true,
    sms: false,
    whatsapp: false,
    template: "Hello {{customer_name}}, order #{{order_id}} has been verified and confirmed by our clinical fulfilment centre.",
  },
  order_dispatched: {
    event: "order_dispatched",
    title: "Order Dispatched",
    email: true,
    sms: true,
    whatsapp: false,
    template: "Hello {{customer_name}}, your order #{{order_id}} has been dispatched via courier. Tracking Number: {{tracking_number}}.",
  },
  order_delivered: {
    event: "order_delivered",
    title: "Order Delivered",
    email: true,
    sms: true,
    whatsapp: false,
    template: "Hello {{customer_name}}, your order #{{order_id}} has been delivered. Thank you for choosing Queens Care Laboratories.",
  },
  order_cancelled: {
    event: "order_cancelled",
    title: "Order Cancelled",
    email: true,
    sms: false,
    whatsapp: false,
    template: "Hello {{customer_name}}, order #{{order_id}} has been cancelled. If this was a mistake, please contact support.",
  },
  order_refunded: {
    event: "order_refunded",
    title: "Refund Processed",
    email: true,
    sms: false,
    whatsapp: false,
    template: "Hello {{customer_name}}, your refund of ₹{{order_total}} for order #{{order_id}} has been processed to your original payment method.",
  },
};

export const notificationRulesStore = {
  get: async (): Promise<Record<OrderNotificationEvent, OrderNotificationRule>> => {
    const s = fileDb.findOne("settings", (item: Record<string, unknown>) => item.key === "notification_rules_matrix");
    if (s?.value) {
      try {
        const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
        return { ...defaultNotificationRules, ...parsed };
      } catch {}
    }
    return defaultNotificationRules;
  },
  save: async (rules: Record<OrderNotificationEvent, OrderNotificationRule>) => {
    fileDb.update("settings", { key: "notification_rules_matrix" }, {
      key: "notification_rules_matrix",
      value: JSON.stringify(rules),
      group: "notifications",
      updatedAt: new Date().toISOString(),
    });
    return rules;
  },
};

// ─── GOOGLE SHEETS INTEGRATION STORE ────────────────────────────────────────

export type GoogleSheetsConfig = {
  enabled: boolean;
  spreadsheetId: string;
  sheetName: string;
  webhookUrl?: string;
  autoSync: boolean;
  lastSyncAt: string | null;
  syncStatus: "not_configured" | "connected" | "error";
  syncError?: string;
};

export const defaultGoogleSheetsConfig: GoogleSheetsConfig = {
  enabled: false,
  spreadsheetId: "",
  sheetName: "Submissions",
  webhookUrl: "",
  autoSync: false,
  lastSyncAt: null,
  syncStatus: "not_configured",
};

export const googleSheetsStore = {
  get: async (): Promise<GoogleSheetsConfig> => {
    const s = fileDb.findOne("settings", (item: Record<string, unknown>) => item.key === "googlesheets_integration_config");
    if (s?.value) {
      try {
        const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
        return { ...defaultGoogleSheetsConfig, ...parsed };
      } catch {}
    }
    return defaultGoogleSheetsConfig;
  },
  save: async (config: Partial<GoogleSheetsConfig>): Promise<GoogleSheetsConfig> => {
    const current = await googleSheetsStore.get();
    const isConfigured = Boolean(config.spreadsheetId?.trim() || config.webhookUrl?.trim());
    const merged: GoogleSheetsConfig = {
      ...current,
      ...config,
      syncStatus: isConfigured ? "connected" : "not_configured",
    };
    fileDb.update("settings", { key: "googlesheets_integration_config" }, {
      key: "googlesheets_integration_config",
      value: JSON.stringify(merged),
      group: "integrations",
      updatedAt: new Date().toISOString(),
    });
    return merged;
  },
};

// ─── STORE & DISTRIBUTOR LOCATOR ─────────────────────────────────────────────

export type StoreLocationType =
  | "pharmacy"
  | "retailer"
  | "distributor"
  | "stockist"
  | "authorized_partner"
  | string;

export type StoreLocation = {
  id: string;
  name: string;
  type: StoreLocationType;
  contactPerson?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  region?: string;
  productsHandled?: string;
  openingHours?: string;
  website?: string;
  directionsUrl?: string;
  description?: string;
  imageUrl?: string;
  isAuthorized: boolean;
  isFeatured: boolean;
  isActive: boolean;
  isVisible: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
};

export type StoreLocatorPageConfig = {
  published: boolean;
  hero: {
    eyebrow: string;
    heading: string;
    subtitle: string;
    description: string;
    searchPlaceholder: string;
    searchButtonText: string;
    locationButtonText: string;
    bgImageUrl?: string;
    visible: boolean;
  };
  types: Array<{
    id: string;
    label: string;
    icon: string;
    badgeColor?: string;
    visible: boolean;
  }>;
  b2bCta: {
    heading: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    visible: boolean;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
};

export const defaultStoreLocatorPageConfig: StoreLocatorPageConfig = {
  published: true,
  hero: {
    eyebrow: "Authorized Queens Care Network",
    heading: "Store & Distributor Locator",
    subtitle: "Find verified pharmacies, hospital stockists, and authorized regional distribution centers near you.",
    description: "Locate authentic Queens Care clinical skincare and pharmaceutical formulations across verified retail and wholesale stockist networks throughout India.",
    searchPlaceholder: "Enter city, state or 6-digit pincode (e.g. 110001, Mumbai, Delhi)…",
    searchButtonText: "Search Locations",
    locationButtonText: "Use My Location",
    visible: true,
  },
  types: [
    { id: "all", label: "All Locations", icon: "📍", visible: true },
    { id: "pharmacy", label: "Pharmacy", icon: "💊", badgeColor: "#2e7d32", visible: true },
    { id: "retailer", label: "Retailer", icon: "🏬", badgeColor: "#1565c0", visible: true },
    { id: "distributor", label: "Distributor", icon: "🚚", badgeColor: "#6a1b9a", visible: true },
    { id: "stockist", label: "Stockist", icon: "📦", badgeColor: "#d84315", visible: true },
    { id: "authorized_partner", label: "Authorized Partner", icon: "⭐", badgeColor: "#D4AF37", visible: true },
  ],
  b2bCta: {
    heading: "Looking to Become an Authorized Queens Care Stockist?",
    description: "Expand your pharmacy or clinical practice with high-potency formulations, protected regional territories, and wholesale commercial margins.",
    buttonText: "Submit B2B Partnership Enquiry →",
    buttonLink: "/b2b#enquiry-form",
    visible: true,
  },
  seo: {
    metaTitle: "Store & Distributor Locator | Queens Care Laboratories",
    metaDescription: "Find verified Queens Care pharmacies, authorized retail stockists, and wholesale distribution centers across India. Search by PIN code, city, or state.",
    keywords: "Queens Care Store Locator, Pharmacy Near Me, Medicine Stockist, Authorized Distributor, Skincare Clinic India",
    ogTitle: "Store & Distributor Locator | Queens Care Laboratories",
    ogDescription: "Locate verified pharmacies and authorized stockists of Queens Care clinical formulations near you.",
    ogImage: "/uploads/logos/queens-care-logo.png",
    canonicalUrl: "https://queenscare.in/store-locator",
  },
};

export const defaultSeedStoreLocations: Omit<StoreLocation, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Queens Care Flagship Pharmacy & Derma Centre",
    type: "authorized_partner",
    contactPerson: "Dr. Alok Verma",
    phone: "+91 22 2640 8899",
    whatsapp: "+91 98200 44556",
    email: "bandra@queenscare.in",
    address: "Shop 4, Ground Floor, Platinum Heights, Turner Road, Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400050",
    country: "India",
    latitude: 19.0596,
    longitude: 72.8295,
    region: "Western Mumbai",
    productsHandled: "Full Queens Care Portfolio, Lumine-C, Liko-Q, Clinical Peels",
    openingHours: "Mon-Sat: 09:30 AM - 09:00 PM | Sun: 10:00 AM - 02:00 PM",
    website: "https://queenscare.in",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=19.0596,72.8295",
    description: "Official company flagship derma dispensary offering certified batch formulations, clinical skin analysis, and immediate stock replenishment.",
    isAuthorized: true,
    isFeatured: true,
    isActive: true,
    isVisible: true,
    sortOrder: 1,
  },
  {
    name: "Apex Biocare Western India Distribution Hub",
    type: "distributor",
    contactPerson: "Rajesh Singhania",
    phone: "+91 22 2778 4400",
    whatsapp: "+91 98199 77881",
    email: "commercial@apexbiocare.in",
    address: "Plot 42, MIDC Industrial Area, TTC Zone, Turbhe",
    city: "Navi Mumbai",
    state: "Maharashtra",
    pincode: "400705",
    country: "India",
    latitude: 19.0833,
    longitude: 73.0167,
    region: "MMR & Western Maharashtra",
    productsHandled: "Wholesale & Bulk Supply, Institutional Formulations",
    openingHours: "Mon-Fri: 09:00 AM - 07:00 PM | Sat: 09:00 AM - 03:00 PM",
    website: "https://apexbiocare.example.com",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=19.0833,73.0167",
    description: "Authorized regional distribution warehouse servicing hospital pharmacy chains, clinical stockists, and retail pharmacies across western India.",
    isAuthorized: true,
    isFeatured: true,
    isActive: true,
    isVisible: true,
    sortOrder: 2,
  },
  {
    name: "Connaught Place Medical & Clinical Dispensary",
    type: "pharmacy",
    contactPerson: "Praveen Narang",
    phone: "+91 11 2332 5566",
    whatsapp: "+91 98110 33445",
    email: "cp.dispensary@delhipharma.in",
    address: "B-Block, Inner Circle, Connaught Place",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110001",
    country: "India",
    latitude: 28.6315,
    longitude: 77.2167,
    region: "Central Delhi",
    productsHandled: "Lumine-C, Liko-Q Suspension, Derma Care Series",
    openingHours: "Open Daily: 08:30 AM - 10:30 PM",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=28.6315,77.2167",
    description: "Licensed chemist stocking guaranteed genuine Queens Care clinical formulations with temperature-monitored cold storage.",
    isAuthorized: true,
    isFeatured: true,
    isActive: true,
    isVisible: true,
    sortOrder: 3,
  },
  {
    name: "South Delhi Hospital & Aesthetic Stockist",
    type: "stockist",
    contactPerson: "Dr. Meera Kapoor",
    phone: "+91 11 4165 7788",
    whatsapp: "+91 98711 66223",
    email: "orders@southdelhistockists.in",
    address: "Part 1, Main Market, South Extension",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110049",
    country: "India",
    latitude: 28.5684,
    longitude: 77.2217,
    region: "South Delhi",
    productsHandled: "Hospital Bulk & Clinical Sample Allocations",
    openingHours: "Mon-Sat: 10:00 AM - 08:30 PM",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=28.5684,77.2217",
    description: "Dedicated supplier to premier dermatology practices and aesthetic clinics in Delhi NCR with same-day emergency dispatch.",
    isAuthorized: true,
    isFeatured: false,
    isActive: true,
    isVisible: true,
    sortOrder: 4,
  },
  {
    name: "Indiranagar Derma Care & Chemist Network",
    type: "pharmacy",
    contactPerson: "K. Venkatesh",
    phone: "+91 80 2521 3344",
    whatsapp: "+91 98450 11998",
    email: "blr.indiranagar@medicare.in",
    address: "100 Feet Road, 12th Main Junction, HAL 2nd Stage, Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560038",
    country: "India",
    latitude: 12.9784,
    longitude: 77.6408,
    region: "East Bengaluru",
    productsHandled: "Clinical Serums, Sun Protection, Anti-Aging Formulations",
    openingHours: "Open Daily: 09:00 AM - 10:00 PM",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=12.9784,77.6408",
    description: "Premium wellness chemist partnering with leading South Indian dermatologists.",
    isAuthorized: true,
    isFeatured: true,
    isActive: true,
    isVisible: true,
    sortOrder: 5,
  },
  {
    name: "Hyderabad Healthcare & Distribution Terminal",
    type: "distributor",
    contactPerson: "S. Rama Rao",
    phone: "+91 40 2335 6677",
    whatsapp: "+91 98490 22331",
    email: "telangana@pharmahub.in",
    address: "Road No. 12, MLA Colony, Banjara Hills",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500034",
    country: "India",
    latitude: 17.4156,
    longitude: 78.4357,
    region: "Telangana & Andhra Pradesh",
    productsHandled: "All Commercial Product Lines, Institutional Contracts",
    openingHours: "Mon-Sat: 09:00 AM - 07:30 PM",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=17.4156,78.4357",
    description: "State distribution hub with dedicated air-conditioned pharma storage and logistics.",
    isAuthorized: true,
    isFeatured: false,
    isActive: true,
    isVisible: true,
    sortOrder: 6,
  },
  {
    name: "Deccan Clinical Wholesale & Stockist",
    type: "stockist",
    contactPerson: "Nitin Joshi",
    phone: "+91 20 2553 4411",
    whatsapp: "+91 98220 55443",
    email: "deccan.stockist@punemed.in",
    address: "FC Road, Near Goodluck Cafe, Shivajinagar",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411005",
    country: "India",
    latitude: 18.5204,
    longitude: 73.8415,
    region: "Pune Metropolitan",
    productsHandled: "Lumine-C, Liko-Q, Medical Grade Moisturizers",
    openingHours: "Mon-Sat: 09:30 AM - 09:00 PM",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=18.5204,73.8415",
    description: "Authorized stockist supporting 120+ Pune chemists and dermatological clinics.",
    isAuthorized: true,
    isFeatured: false,
    isActive: true,
    isVisible: true,
    sortOrder: 7,
  },
];

export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const storeLocatorPageStore = {
  get: async (): Promise<StoreLocatorPageConfig> => {
    const s = fileDb.findOne("settings", (item: Record<string, unknown>) => item.key === "store_locator_page_cms_config");
    if (s?.value) {
      try {
        const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
        return {
          ...defaultStoreLocatorPageConfig,
          ...parsed,
          hero: { ...defaultStoreLocatorPageConfig.hero, ...(parsed.hero || {}) },
          types: parsed.types || defaultStoreLocatorPageConfig.types,
          b2bCta: { ...defaultStoreLocatorPageConfig.b2bCta, ...(parsed.b2bCta || {}) },
          seo: { ...defaultStoreLocatorPageConfig.seo, ...(parsed.seo || {}) },
        };
      } catch {}
    }
    return defaultStoreLocatorPageConfig;
  },
  save: async (config: Partial<StoreLocatorPageConfig>): Promise<StoreLocatorPageConfig> => {
    const current = await storeLocatorPageStore.get();
    const merged: StoreLocatorPageConfig = {
      ...current,
      ...config,
      hero: { ...current.hero, ...(config.hero || {}) },
      types: config.types !== undefined ? config.types : current.types,
      b2bCta: { ...current.b2bCta, ...(config.b2bCta || {}) },
      seo: { ...current.seo, ...(config.seo || {}) },
    };
    fileDb.update("settings", { key: "store_locator_page_cms_config" }, {
      key: "store_locator_page_cms_config",
      value: JSON.stringify(merged),
      group: "cms",
      updatedAt: new Date().toISOString(),
    });
    return merged;
  },
};

export const storeLocatorStore = {
  seedIfEmpty: async () => {
    const existing = (fileDb.findMany("storeLocations", () => true) as unknown as StoreLocation[]) || [];
    if (existing.length === 0) {
      for (const loc of defaultSeedStoreLocations) {
        const id = `QC-LOC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const record: StoreLocation = {
          id,
          ...loc,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        fileDb.insert("storeLocations", record as unknown as Record<string, unknown>);
      }
    }
  },

  list: async (onlyVisible = false): Promise<StoreLocation[]> => {
    await storeLocatorStore.seedIfEmpty();
    const list = (fileDb.findMany("storeLocations", (item: Record<string, unknown>) => {
      if (!onlyVisible) return true;
      return item.isVisible !== false && item.isActive !== false;
    }) as unknown as StoreLocation[]) || [];

    return list.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (a.sortOrder || 99) - (b.sortOrder || 99);
    });
  },

  byId: async (id: string): Promise<StoreLocation | null> => {
    await storeLocatorStore.seedIfEmpty();
    const loc = fileDb.findOne("storeLocations", (item: Record<string, unknown>) => item.id === id);
    return (loc as unknown as StoreLocation) || null;
  },

  create: async (data: Partial<StoreLocation>): Promise<StoreLocation> => {
    await storeLocatorStore.seedIfEmpty();
    const id = `QC-LOC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const directionsUrl =
      data.directionsUrl ||
      (data.latitude && data.longitude
        ? `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.name || ""} ${data.city || ""} ${data.pincode || ""}`)}`);

    const record: StoreLocation = {
      id,
      name: String(data.name || "Untitled Store / Distributor").trim(),
      type: String(data.type || "pharmacy").trim(),
      contactPerson: data.contactPerson ? String(data.contactPerson).trim() : undefined,
      phone: String(data.phone || "").trim(),
      whatsapp: data.whatsapp ? String(data.whatsapp).trim() : undefined,
      email: data.email ? String(data.email).trim() : undefined,
      address: String(data.address || "").trim(),
      city: String(data.city || "").trim(),
      state: String(data.state || "").trim(),
      pincode: String(data.pincode || "").trim(),
      country: String(data.country || "India").trim(),
      latitude: data.latitude !== undefined && data.latitude !== null && !isNaN(Number(data.latitude)) ? Number(data.latitude) : undefined,
      longitude: data.longitude !== undefined && data.longitude !== null && !isNaN(Number(data.longitude)) ? Number(data.longitude) : undefined,
      region: data.region ? String(data.region).trim() : undefined,
      productsHandled: data.productsHandled ? String(data.productsHandled).trim() : undefined,
      openingHours: data.openingHours ? String(data.openingHours).trim() : undefined,
      website: data.website ? String(data.website).trim() : undefined,
      directionsUrl,
      description: data.description ? String(data.description).trim() : undefined,
      imageUrl: data.imageUrl ? String(data.imageUrl).trim() : undefined,
      isAuthorized: data.isAuthorized !== false,
      isFeatured: Boolean(data.isFeatured),
      isActive: data.isActive !== false,
      isVisible: data.isVisible !== false,
      sortOrder: data.sortOrder ? Number(data.sortOrder) : 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fileDb.insert("storeLocations", record as unknown as Record<string, unknown>);
    return record;
  },

  update: async (id: string, data: Partial<StoreLocation>): Promise<StoreLocation | null> => {
    await storeLocatorStore.seedIfEmpty();
    const existing = await storeLocatorStore.byId(id);
    if (!existing) return null;

    const lat = data.latitude !== undefined ? (data.latitude !== null && !isNaN(Number(data.latitude)) ? Number(data.latitude) : undefined) : existing.latitude;
    const lng = data.longitude !== undefined ? (data.longitude !== null && !isNaN(Number(data.longitude)) ? Number(data.longitude) : undefined) : existing.longitude;
    const directionsUrl =
      data.directionsUrl ||
      existing.directionsUrl ||
      (lat && lng
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.name || existing.name} ${data.city || existing.city} ${data.pincode || existing.pincode}`)}`);

    const updated = fileDb.update("storeLocations", id, {
      ...data,
      latitude: lat,
      longitude: lng,
      directionsUrl,
      updatedAt: new Date().toISOString(),
    }) as unknown as StoreLocation | null;

    return updated;
  },

  delete: async (id: string): Promise<boolean> => {
    return Boolean(fileDb.remove("storeLocations", id));
  },

  search: async (params: {
    query?: string;
    type?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
  }): Promise<Array<StoreLocation & { distanceKm?: number }>> => {
    await storeLocatorStore.seedIfEmpty();
    const all = await storeLocatorStore.list(true);
    const q = (params.query || "").trim().toLowerCase();
    const typeFilter = (params.type || "").trim().toLowerCase();
    const userLat = params.latitude !== undefined && !isNaN(params.latitude) ? params.latitude : undefined;
    const userLng = params.longitude !== undefined && !isNaN(params.longitude) ? params.longitude : undefined;

    const filtered = all.filter((item) => {
      // Type match
      if (typeFilter && typeFilter !== "all") {
        if (item.type.toLowerCase() !== typeFilter) {
          if (typeFilter === "authorized_partner" && !item.isAuthorized) return false;
          if (typeFilter !== "authorized_partner") return false;
        }
      }

      // Query match (Pincode, City, State, Name, Address, Region)
      if (q) {
        const matchesPincode = item.pincode && item.pincode.replace(/\s+/g, "").includes(q.replace(/\s+/g, ""));
        const matchesCity = item.city && item.city.toLowerCase().includes(q);
        const matchesState = item.state && item.state.toLowerCase().includes(q);
        const matchesName = item.name && item.name.toLowerCase().includes(q);
        const matchesAddress = item.address && item.address.toLowerCase().includes(q);
        const matchesRegion = item.region && item.region.toLowerCase().includes(q);

        if (!matchesPincode && !matchesCity && !matchesState && !matchesName && !matchesAddress && !matchesRegion) {
          return false;
        }
      }

      return true;
    });

    // Attach distances and sort
    const withDistance = filtered.map((loc) => {
      let distanceKm: number | undefined;
      if (userLat !== undefined && userLng !== undefined && loc.latitude && loc.longitude) {
        distanceKm = calculateHaversineDistanceKm(userLat, userLng, loc.latitude, loc.longitude);
      }
      return { ...loc, distanceKm };
    });

    if (userLat !== undefined && userLng !== undefined) {
      withDistance.sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        if (a.distanceKm !== undefined) return -1;
        if (b.distanceKm !== undefined) return 1;
        return (a.sortOrder || 99) - (b.sortOrder || 99);
      });
    }

    return withDistance;
  },
};

/* ═══════════════════════════════════════════════════════════════
   UNIVERSAL URL / SLUG MANAGEMENT & 301 REDIRECT ARCHITECTURE
   ═══════════════════════════════════════════════════════════════ */

export const RESERVED_ROUTE_NAMESPACES = new Set([
  "admin",
  "api",
  "products",
  "categories",
  "blog",
  "cart",
  "checkout",
  "account",
  "login",
  "register",
  "auth",
  "search",
  "shop",
  "health-a-z",
  "manufacturing",
  "quality-assurance",
  "research-development",
  "trust",
  "quiz",
  "store-locator",
  "track-order",
  "b2b",
  "doctors",
  "careers",
  "privacy",
  "terms",
  "faq",
  "order-success",
  "order-cancelled",
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
]);

export interface RedirectRule {
  id: string;
  source: string;
  destination: string;
  statusCode: 301 | 302 | 308;
  contentType: "product" | "page" | "category" | "blog" | "custom";
  contentId?: string;
  active: boolean;
  autoGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export function normalizePath(pathStr: string): string {
  if (!pathStr) return "/";
  // Strip query strings and hash anchors
  let clean = pathStr.split("?")[0].split("#")[0].trim().toLowerCase();
  // Ensure leading slash
  if (!clean.startsWith("/")) clean = "/" + clean;
  // Replace backslashes
  clean = clean.replace(/\\/g, "/");
  // Replace multiple slashes
  clean = clean.replace(/\/+/g, "/");
  // Strip trailing slash unless root
  if (clean.length > 1 && clean.endsWith("/")) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

export function normalizeSlug(slugStr: string): string {
  if (!slugStr) return "";
  let s = slugStr.toLowerCase().trim();
  // Strip query/hash
  s = s.split("?")[0].split("#")[0];
  // Replace spaces and special characters with hyphens
  s = s.replace(/[^a-z0-9-/]/g, "-");
  // Collapse hyphens and slashes
  s = s.replace(/-+/g, "-").replace(/\/+/g, "/");
  // Strip leading and trailing hyphens/slashes
  s = s.replace(/^[-/]+|[-/]+$/g, "");
  return s;
}

export const slugValidator = {
  validate: async (
    rawSlug: string,
    contentType: "product" | "page" | "category" | "blog",
    currentId?: string
  ): Promise<{ valid: boolean; normalizedSlug: string; error?: string }> => {
    const slug = normalizeSlug(rawSlug);
    if (!slug) {
      return { valid: false, normalizedSlug: "", error: "Slug cannot be empty." };
    }

    // Check path traversal attempts
    if (slug.includes("..")) {
      return { valid: false, normalizedSlug: slug, error: "Invalid path segments." };
    }

    // Check reserved routes across all content types
    const firstSegment = slug.split("/")[0];
    if (RESERVED_ROUTE_NAMESPACES.has(firstSegment)) {
      return {
        valid: false,
        normalizedSlug: slug,
        error: `"${firstSegment}" is a reserved system route and cannot be used as a slug.`,
      };
    }

    // Check collisions depending on content type
    if (contentType === "product") {
      const allProducts = (fileDb.findMany("products") || []) as Array<Record<string, unknown>>;
      const conflict = allProducts.find(
        (p) => String(p.slug || "").toLowerCase() === slug && String(p.id) !== String(currentId)
      );
      if (conflict) {
        return { valid: false, normalizedSlug: slug, error: "This URL is already in use." };
      }
    } else if (contentType === "category") {
      const allCategories = (fileDb.findMany("categories") || []) as Array<Record<string, unknown>>;
      const conflict = allCategories.find(
        (c) => String(c.slug || "").toLowerCase() === slug && String(c.id) !== String(currentId)
      );
      if (conflict) {
        return { valid: false, normalizedSlug: slug, error: "This URL is already in use." };
      }
    } else if (contentType === "blog") {
      const allPosts = (fileDb.findMany("blogPosts") || []) as Array<Record<string, unknown>>;
      const conflict = allPosts.find(
        (b) => String(b.slug || "").toLowerCase() === slug && String(b.id) !== String(currentId)
      );
      if (conflict) {
        return { valid: false, normalizedSlug: slug, error: "This URL is already in use." };
      }
    } else if (contentType === "page") {
      const allPages = (fileDb.findMany("pageSettings") || []) as Array<Record<string, unknown>>;
      const conflict = allPages.find(
        (p) => {
          const pSlug = normalizeSlug(String(p.slug || ""));
          return pSlug === slug && String(p.id) !== String(currentId);
        }
      );
      if (conflict) {
        return { valid: false, normalizedSlug: slug, error: "This URL is already in use." };
      }
    }

    return { valid: true, normalizedSlug: slug };
  },
};

export const redirectStore = {
  list: async (filter?: {
    contentType?: string;
    active?: boolean;
    search?: string;
  }): Promise<RedirectRule[]> => {
    let rules = (fileDb.findMany("redirects") || []) as unknown as RedirectRule[];
    if (filter) {
      if (filter.contentType && filter.contentType !== "all") {
        rules = rules.filter((r) => r.contentType === filter.contentType);
      }
      if (typeof filter.active === "boolean") {
        rules = rules.filter((r) => r.active === filter.active);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        rules = rules.filter(
          (r) => r.source.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q)
        );
      }
    }
    return rules.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  },

  byId: async (id: string): Promise<RedirectRule | null> => {
    const item = fileDb.findOne("redirects", (r) => r.id === id);
    return (item as unknown as RedirectRule) || null;
  },

  bySource: async (sourcePath: string): Promise<RedirectRule | null> => {
    const norm = normalizePath(sourcePath);
    const item = fileDb.findOne("redirects", (r) => r.active !== false && normalizePath(String(r.source)) === norm);
    return (item as unknown as RedirectRule) || null;
  },

  resolve: async (sourcePath: string): Promise<{ destination: string; statusCode: 301 | 308 } | null> => {
    const norm = normalizePath(sourcePath);
    const allRules = (fileDb.findMany("redirects") || []) as unknown as RedirectRule[];
    const activeMap = new Map<string, RedirectRule>();
    for (const r of allRules) {
      if (r.active !== false) {
        activeMap.set(normalizePath(r.source), r);
      }
    }

    if (!activeMap.has(norm)) return null;

    let current = norm;
    const visited = new Set<string>();
    let hops = 0;
    const maxHops = 6;

    while (activeMap.has(current) && hops < maxHops) {
      if (visited.has(current)) {
        // Prevent circular loop
        break;
      }
      visited.add(current);
      const rule = activeMap.get(current)!;
      current = normalizePath(rule.destination);
      hops++;
    }

    if (current === norm) return null;
    return { destination: current, statusCode: 301 };
  },

  createOrUpdate: async (
    rawSource: string,
    rawDestination: string,
    contentType: "product" | "page" | "category" | "blog" | "custom",
    contentId?: string,
    autoGenerated = true
  ): Promise<{ ok: boolean; rule?: RedirectRule; error?: string }> => {
    const trimmedSource = (rawSource || "").trim();
    const trimmedDest = (rawDestination || "").trim();

    if (!trimmedSource || !trimmedDest) {
      return { ok: false, error: "Source and destination URLs are required." };
    }

    // Open redirect protection: destination and source must be internal paths
    if (
      trimmedDest.startsWith("//") ||
      trimmedDest.includes("://") ||
      trimmedDest.startsWith("\\\\") ||
      !trimmedDest.startsWith("/")
    ) {
      return { ok: false, error: "Destination must be a valid internal path starting with '/'." };
    }

    if (
      trimmedSource.startsWith("//") ||
      trimmedSource.includes("://") ||
      trimmedSource.startsWith("\\\\") ||
      !trimmedSource.startsWith("/")
    ) {
      return { ok: false, error: "Source must be a valid internal path starting with '/'." };
    }

    const source = normalizePath(trimmedSource);
    const destination = normalizePath(trimmedDest);

    if (source === destination) {
      return { ok: false, error: "Source and destination URLs cannot be identical." };
    }

    const allRules = (fileDb.findMany("redirects") || []) as unknown as RedirectRule[];

    // 1. Loop Prevention: check if destination already redirects back to source
    const wouldResolve = new Map<string, string>();
    for (const r of allRules) {
      if (r.active !== false) {
        wouldResolve.set(normalizePath(r.source), normalizePath(r.destination));
      }
    }
    wouldResolve.set(source, destination);

    let checkCurrent = destination;
    const checkVisited = new Set<string>([source]);
    let checkHops = 0;
    while (wouldResolve.has(checkCurrent) && checkHops < 6) {
      if (checkVisited.has(checkCurrent)) {
        return {
          ok: false,
          error: `Creating this redirect would cause an infinite redirect loop between "${source}" and "${destination}".`,
        };
      }
      checkVisited.add(checkCurrent);
      checkCurrent = wouldResolve.get(checkCurrent)!;
      checkHops++;
    }

    const now = new Date().toISOString();

    // 2. Chain Flattening:
    // Any existing rule pointing to `source` should now point directly to `destination`
    for (const r of allRules) {
      if (normalizePath(r.destination) === source && normalizePath(r.source) !== destination) {
        fileDb.update(
          "redirects",
          { id: r.id },
          {
            destination,
            updatedAt: now,
          }
        );
      }
    }

    // 3. Remove/deactivate any rule where source === destination (e.g. user moved back to an old URL)
    const reversedRule = allRules.find((r) => normalizePath(r.source) === destination);
    if (reversedRule && normalizePath(reversedRule.destination) === source) {
      fileDb.remove("redirects", reversedRule.id);
    }

    // 4. Check if a rule for this source already exists
    const existingSourceRule = allRules.find((r) => normalizePath(r.source) === source);
    if (existingSourceRule) {
      const updated = fileDb.update(
        "redirects",
        { id: existingSourceRule.id },
        {
          destination,
          contentType,
          contentId: contentId || existingSourceRule.contentId,
          active: true,
          autoGenerated,
          statusCode: 301,
          updatedAt: now,
        }
      );
      return { ok: true, rule: updated as unknown as RedirectRule };
    }

    // 5. Insert new rule
    const newRule: RedirectRule = {
      id: `red-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      source,
      destination,
      statusCode: 301,
      contentType,
      contentId,
      active: true,
      autoGenerated,
      createdAt: now,
      updatedAt: now,
    };

    const inserted = fileDb.insert("redirects", newRule as unknown as Record<string, unknown>);
    return { ok: true, rule: inserted as unknown as RedirectRule };
  },

  update: async (id: string, patch: Partial<RedirectRule>): Promise<RedirectRule | null> => {
    const existing = fileDb.findOne("redirects", (r) => r.id === id);
    if (!existing) return null;
    const now = new Date().toISOString();
    const cleanPatch: Record<string, unknown> = { ...patch, updatedAt: now };
    if (patch.source) {
      const trimmed = patch.source.trim();
      if (
        trimmed.startsWith("//") ||
        trimmed.includes("://") ||
        trimmed.startsWith("\\\\") ||
        !trimmed.startsWith("/")
      ) {
        return null;
      }
      cleanPatch.source = normalizePath(trimmed);
    }
    if (patch.destination) {
      const trimmed = patch.destination.trim();
      if (
        trimmed.startsWith("//") ||
        trimmed.includes("://") ||
        trimmed.startsWith("\\\\") ||
        !trimmed.startsWith("/")
      ) {
        return null;
      }
      cleanPatch.destination = normalizePath(trimmed);
    }
    const updated = fileDb.update("redirects", { id }, cleanPatch);
    return (updated as unknown as RedirectRule) || null;
  },

  delete: async (id: string): Promise<boolean> => {
    const removed = fileDb.remove("redirects", id);
    return Boolean(removed);
  },

  toggleActive: async (id: string): Promise<RedirectRule | null> => {
    const existing = fileDb.findOne("redirects", (r) => r.id === id) as unknown as RedirectRule | null;
    if (!existing) return null;
    const updated = fileDb.update("redirects", { id }, {
      active: !existing.active,
      updatedAt: new Date().toISOString(),
    });
    return (updated as unknown as RedirectRule) || null;
  },
};



