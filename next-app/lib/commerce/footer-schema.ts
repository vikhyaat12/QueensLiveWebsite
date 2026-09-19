/**
 * Queens Care - Global Footer CMS Schema & Utilities
 * ZERO HARDCODE • FULL ADMIN CONTROL • PRODUCTION READY
 */

export interface FooterTrustItem {
  id: string;
  icon: string; // Emoji, SVG markup, or icon path
  title: string;
  subtitle: string;
  linkUrl?: string;
  clickable?: boolean; // When false (and visible), item renders as non-interactive (no link). Defaults to true.
  visible: boolean;
  sortOrder: number;
}

export interface FooterTrustStripConfig {
  enabled: boolean;
  tagline: string; // e.g. "Together for a healthier tomorrow ♡"
  items: FooterTrustItem[];
}

export interface FooterBrandConfig {
  logoUrl: string;
  logoAlt: string;
  logoHeight: number;
  aboutText: string;
  certificationsText: string; // e.g. "✦ ISO 9001:2015 & WHO-GMP Certified"
  showSocialMedia: boolean;
  socialTitle: string; // e.g. "Official Social Channels"
}

export interface FooterNavLink {
  id: string;
  label: string;
  href: string;
  target?: "_self" | "_blank";
  badge?: string;
  highlight?: boolean;
  visible: boolean;
  sortOrder: number;
}

export interface FooterNavColumn {
  id: string;
  title: string;
  visible: boolean;
  sortOrder: number;
  links: FooterNavLink[];
}

export interface FooterBadgePill {
  id: string;
  label: string;
  styleVariant?: "gold" | "white" | "outline";
  visible: boolean;
}

export interface FooterContactConfig {
  enabled: boolean;
  title: string;
  headquartersLabel: string;
  headquartersText: string;
  helplineLabel: string;
  helplineText: string;
  verificationLabel: string;
  verificationText: string;
  badges: FooterBadgePill[];
  visible: boolean;
}

export interface FooterRegulatoryConfig {
  enabled: boolean;
  titleStatutory: string;
  titlePharmacist: string;
  useCompanyInfoSettings: boolean;
  customDrugLicenseNo?: string;
  customFssaiNo?: string;
  customGstin?: string;
  customPharmacistInfo?: string;
  customGrievanceEmail?: string;
  dispatchProtocolText: string;
  showOnlyIfConfigured: boolean;
}

export interface FooterClinicalNoticeConfig {
  enabled: boolean;
  title: string;
  contentHtml: string;
  fallbackDisclaimer: string;
}

export interface FooterCopyrightLink {
  id: string;
  label: string;
  href: string;
  target?: "_self" | "_blank";
  visible: boolean;
  sortOrder: number;
}

export interface FooterCopyrightConfig {
  template: string; // Supported tokens: {{YEAR}}, {{COMPANY_NAME}}
  links: FooterCopyrightLink[];
}

export interface FooterStylingConfig {
  backgroundColor: string;
  trustBarBg: string;
  textColor: string;
  accentColor: string;
  mutedTextColor: string;
  borderColor: string;
}

export interface FooterConfig {
  version: number;
  isPublished: boolean;
  updatedAt: string;
  updatedBy?: string;
  trustStrip: FooterTrustStripConfig;
  brand: FooterBrandConfig;
  columns: FooterNavColumn[];
  contact: FooterContactConfig;
  regulatory: FooterRegulatoryConfig;
  clinicalNotice: FooterClinicalNoticeConfig;
  copyright: FooterCopyrightConfig;
  styling: FooterStylingConfig;
}

export interface FooterSnapshot {
  id: string;
  version: number;
  timestamp: string;
  publishedBy: string;
  summary: string;
  config: FooterConfig;
}

/**
 * Brand-faithful default configuration matching Queens Care luxury pharmaceutical standards
 */
export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  version: 1,
  isPublished: true,
  updatedAt: new Date().toISOString(),
  updatedBy: "System Initializer",
  trustStrip: {
    enabled: true,
    tagline: "Together for a healthier tomorrow ♡",
    items: [
      {
        id: "trust-1",
        icon: "🛡️",
        title: "Quality You Can Trust",
        subtitle: "In Every Product",
        linkUrl: "/quality-assurance",
        clickable: true,
        visible: true,
        sortOrder: 0,
      },
      {
        id: "trust-2",
        icon: "⚛️",
        title: "Science-Backed",
        subtitle: "Formulations",
        linkUrl: "/#science",
        clickable: true,
        visible: true,
        sortOrder: 1,
      },
      {
        id: "trust-3",
        icon: "👥",
        title: "People-Driven",
        subtitle: "Growth",
        linkUrl: "/about",
        clickable: true,
        visible: true,
        sortOrder: 2,
      },
      {
        id: "trust-4",
        icon: "💖",
        title: "A Healthier Tomorrow",
        subtitle: "For Everyone",
        linkUrl: "/products",
        clickable: true,
        visible: true,
        sortOrder: 3,
      },
    ],
  },
  brand: {
    logoUrl: "/images/brand/queens-care-official-original.png",
    logoAlt: "Queens Care Laboratories",
    logoHeight: 54,
    aboutText:
      "Queens Care Laboratories is an advanced pharmaceutical enterprise dedicated to therapeutic purity, clinical excellence, and holistic healthcare across India.",
    certificationsText: "",
    showSocialMedia: true,
    socialTitle: "Official Social Channels",
  },
  columns: [
    {
      id: "col-company",
      title: "Company & Science",
      visible: true,
      sortOrder: 0,
      links: [
        { id: "lnk-1", label: "About Queens Care", href: "/about", visible: true, sortOrder: 0 },
        { id: "lnk-2", label: "Our People & Leadership", href: "/employee", highlight: true, visible: true, sortOrder: 1 },
        { id: "lnk-3", label: "Clinical R&D Standards", href: "/#science", visible: true, sortOrder: 2 },
        { id: "lnk-4", label: "Manufacturing Hubs", href: "/manufacturing", visible: true, sortOrder: 3 },
        { id: "lnk-5", label: "Careers & Opportunities", href: "/careers", visible: true, sortOrder: 4 },
      ],
    },
    {
      id: "col-formulations",
      title: "Formulations",
      visible: true,
      sortOrder: 1,
      links: [
        { id: "lnk-6", label: "Immunity & Cellular Vitality", href: "/#collection", visible: true, sortOrder: 0 },
        { id: "lnk-7", label: "Dermatological Nutrition", href: "/#collection", visible: true, sortOrder: 1 },
        { id: "lnk-8", label: "Digestive & Microbiome Balance", href: "/#collection", visible: true, sortOrder: 2 },
        { id: "lnk-9", label: "Bone & Joint Flexibility", href: "/#collection", visible: true, sortOrder: 3 },
        { id: "lnk-10", label: "Institutional & Clinic Supply", href: "/b2b", visible: true, sortOrder: 4 },
      ],
    },
  ],
  contact: {
    enabled: true,
    title: "Patient Support & Verification",
    headquartersLabel: "Headquarters",
    headquartersText: "",
    helplineLabel: "Care Helpline",
    helplineText: "",
    verificationLabel: "Verification",
    verificationText: "",
    visible: false,
    badges: [],
  },
  regulatory: {
    enabled: true,
    titleStatutory: "STATUTORY REGISTRATIONS",
    titlePharmacist: "PHARMACIST & GRIEVANCE DESK",
    useCompanyInfoSettings: true,
    customDrugLicenseNo: "",
    customFssaiNo: "",
    customGstin: "",
    customPharmacistInfo: "",
    customGrievanceEmail: "",
    dispatchProtocolText: "",
    showOnlyIfConfigured: true,
  },
  clinicalNotice: {
    enabled: true,
    title: "CLINICAL NOTICE",
    contentHtml:
      "Formulations are manufactured under stringent quality standards. For medical guidance or individualized therapy, consult a registered medical practitioner.",
    fallbackDisclaimer:
      "CLINICAL HEALTHCARE DISCLAIMER: Statements regarding dietary supplements and wellness formulations have not been evaluated for prescription replacement. Consult a qualified healthcare professional before beginning any new supplementation regimen.",
  },
  copyright: {
    template: "© {{YEAR}} {{COMPANY_NAME}}. All rights reserved.",
    links: [
      { id: "cpl-1", label: "Privacy Policy", href: "/privacy", visible: true, sortOrder: 0 },
      { id: "cpl-2", label: "Terms of Service", href: "/terms", visible: true, sortOrder: 1 },
      { id: "cpl-3", label: "Contact Us", href: "/contact", visible: true, sortOrder: 2 },
      { id: "cpl-4", label: "Our People", href: "/employee", visible: true, sortOrder: 3 },
    ],
  },
  styling: {
    backgroundColor: "#150522",
    trustBarBg: "linear-gradient(135deg, #1C0A2E 0%, #2A0F3A 50%, #180927 100%)",
    textColor: "#FAF8F5",
    accentColor: "#D4AF37",
    mutedTextColor: "rgba(255, 255, 255, 0.7)",
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
};

/**
 * Token interpolation utility for footer copyright, notes, and dynamic labels
 */
export function interpolateFooterTokens(
  template: string,
  tokens: { year?: string | number; companyName?: string; [key: string]: string | number | undefined }
): string {
  if (!template) return "";
  let result = template;
  const currentYear = String(tokens.year ?? new Date().getFullYear());
  const companyName = String(tokens.companyName ?? "Queens Care Laboratories");

  result = result.replace(/{{\s*YEAR\s*}}/gi, currentYear);
  result = result.replace(/{{\s*COMPANY_NAME\s*}}/gi, companyName);

  for (const [key, val] of Object.entries(tokens)) {
    if (val !== undefined && key !== "year" && key !== "companyName") {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
      result = result.replace(pattern, String(val));
    }
  }

  return result;
}

/**
 * Internal-only route allowlist for Admin-configured destinations.
 * Blocks open redirects, javascript:/data: URLs and protocol-relative hosts.
 */
const TRUST_ITEM_ALLOWED_ROUTES = new Set([
  "/",
  "/shop",
  "/products",
  "/about",
  "/science",
  "/quality-assurance",
  "/manufacturing",
  "/research-development",
  "/contact",
  "/faq",
  "/b2b",
  "/blog",
  "/careers",
  "/trust",
  "/track-order",
]);

function isAllowedInternalDestination(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  const url = raw.trim();
  // Reject empty, protocol-relative (//host) and any absolute scheme (javascript:, https:, mailto:, ...)
  if (!url || !url.startsWith("/") || url.startsWith("//")) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) return false;
  const path = url.split("#")[0].split("?")[0].replace(/\/+$/, "") || "/";
  return TRUST_ITEM_ALLOWED_ROUTES.has(path) || path.startsWith("/products/") || path.startsWith("/categories/");
}

/**
 * Deep validation for footer configuration
 */
export function validateFooterConfig(data: unknown): { valid: boolean; errors: string[]; config?: FooterConfig } {
  const errors: string[] = [];
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Footer configuration must be a valid JSON object"] };
  }

  const c = data as Partial<FooterConfig>;

  if (c.trustStrip && typeof c.trustStrip === "object") {
    if (!Array.isArray(c.trustStrip.items)) {
      errors.push("Trust strip items must be an array");
    } else {
      c.trustStrip.items.forEach((item, i) => {
        if (item && typeof item === "object") {
          // Normalize whitespace-padded destinations
          if (typeof item.linkUrl === "string") {
            item.linkUrl = item.linkUrl.trim();
          }
          // A clickable item must have a safe internal destination
          if (item.clickable !== false && !isAllowedInternalDestination(item.linkUrl)) {
            errors.push(
              `Trust item ${i}: clickable requires a valid internal destination (got "${item.linkUrl ?? ""}")`
            );
          }
        }
      });
    }
  }

  if (c.columns && !Array.isArray(c.columns)) {
    errors.push("Navigation columns must be an array");
  }

  if (c.copyright && typeof c.copyright === "object") {
    if (c.copyright.links && !Array.isArray(c.copyright.links)) {
      errors.push("Copyright links must be an array");
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], config: data as FooterConfig };
}
