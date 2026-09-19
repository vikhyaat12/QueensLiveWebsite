export type PromoComponentType =
  | "ticker"
  | "media_block"
  | "gamification"
  | "affiliate_block";

export type PromoStatus = "draft" | "published" | "paused" | "expired" | "archived";

export type DeviceTarget = "desktop" | "tablet" | "mobile";

export type PromoSlot =
  // GLOBAL
  | "global_top"
  | "global_above_header"
  | "global_below_header"
  | "global_above_announcement"
  | "global_below_announcement"
  | "global_announcement"
  | "global_footer"
  | "global_above_footer"
  // HOME
  | "home_hero_top"
  | "home_hero_bottom"
  | "home_between_sections"
  | "home_before_products"
  | "home_after_products"
  | "home_before_testimonials"
  | "home_after_testimonials"
  | "home_cms_section"
  // CATEGORY
  | "category_top"
  | "category_section"
  | "category_before_grid"
  | "category_after_grid"
  | "category_bottom"
  // SEARCH
  | "search_top"
  | "search_results_section"
  | "search_bottom"
  // PRODUCT PDP
  | "product_above_info"
  | "product_below_title"
  | "product_below_price"
  | "product_below_atc"
  | "product_below_buy_now"
  | "product_above_description"
  | "product_between_descriptions"
  | "product_below_description"
  | "product_above_aplus"
  | "product_inside_aplus"
  | "product_below_aplus"
  | "product_before_related"
  | "product_after_related"
  | "product_bottom"
  // CART
  | "cart_top"
  | "cart_inside"
  | "cart_below_items"
  | "cart_before_checkout_cta"
  | "cart_bottom"
  // CHECKOUT
  | "checkout_top"
  | "checkout_below_summary"
  // ACCOUNT
  | "account_dashboard"
  | "account_orders"
  | "account_wishlist"
  | "account_profile"
  | "account_invoice"
  // CONTENT
  | "content_about"
  | "content_people"
  | "content_science"
  | "content_blog"
  | "content_contact"
  | "content_careers"
  | "content_faq"
  // AFFILIATE
  | "affiliate_landing"
  | "affiliate_dashboard"
  | "affiliate_campaign"
  | "affiliate_product"
  | "affiliate_promos";

export interface TickerItem {
  id: string;
  text: string;
  icon?: string;
  image?: string;
  link?: string;
  highlight?: boolean;
}

export interface PromoMediaImage {
  desktopUrl?: string;
  tabletUrl?: string;
  mobileUrl?: string;
  alt?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  objectFit?: "cover" | "contain" | "fill";
  objectPosition?: string;
  borderRadius?: number;
  overlayOpacity?: number;
  overlayColor?: string;
}

export interface PromoMediaVideo {
  mp4Url?: string;
  webmUrl?: string;
  posterUrl?: string;
  desktopVideoUrl?: string;
  mobileVideoUrl?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  aspectRatio?: string;
  objectFit?: "cover" | "contain";
}

export interface PromoCTA {
  enabled?: boolean;
  text?: string;
  destination?: string;
  openInNewTab?: boolean;
  style?: "solid" | "outline" | "text" | "pill";
  backgroundColor?: string;
  textColor?: string;
}

export interface PromoGamificationConfig {
  gameType: "free_shipping_progress" | "cart_milestone" | "reward_tier" | "coupon_reveal" | "promotional_bar";
  thresholdType: "server_free_shipping" | "custom_amount" | "item_count";
  customThreshold?: number;
  rewardDescription?: string;
  couponCode?: string;
  progressLabelFormat?: string; // e.g. "Add {remaining} for Free Shipping"
  successTitle?: string;        // e.g. "🎉 You have qualified for FREE express delivery!"
  barHeight?: number;
  barFillColor?: string;
  barBgColor?: string;
  animated?: boolean;
  // Computed server values:
  computedThreshold?: number;
  computedRemaining?: number;
  computedProgressPercent?: number;
  computedIsUnlocked?: boolean;
}

export interface PromoStyling {
  backgroundColor?: string;
  gradient?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: number | string;
  letterSpacing?: string;
  lineHeight?: string;
  textAlign?: "left" | "center" | "right";
  padding?: string;
  margin?: string;
  maxWidth?: string;
  borderRadius?: string;
  border?: string;
  boxShadow?: string;
}

export interface PromoComponent {
  id: string;
  name: string;
  type: PromoComponentType;
  status: PromoStatus;
  enabled: boolean;

  placement: {
    slot: PromoSlot | string;
    priority: number;
    stackOrder?: number;
  };

  schedule?: {
    startDate?: string;
    endDate?: string;
    timezone?: string;
  };

  targeting: {
    pageType?: string[];
    specificRoutes?: string[];
    categories?: string[];
    productIds?: string[];
    skus?: string[];
    affiliateCampaignIds?: string[];
    userAudience?: "all" | "guests" | "logged_in" | "new_customers" | "returning_customers";
    devices?: DeviceTarget[];
    excludedRoutes?: string[];
  };

  content: {
    headline?: string;
    subheadline?: string;
    body?: string;
    badgeText?: string;
    successMessage?: string;

    // Ticker fields
    items?: TickerItem[];
    tickerSpeed?: number;
    tickerMobileSpeed?: number;
    tickerDirection?: "rtl" | "ltr";
    tickerSeparator?: string;
    pauseOnHover?: boolean;

    // Media fields
    mediaType?: "none" | "image" | "video" | "mixed";
    image?: PromoMediaImage;
    video?: PromoMediaVideo;
    cta?: PromoCTA;

    // Gamification fields
    gamification?: PromoGamificationConfig;

    // Affiliate specific fields
    affiliate?: {
      campaignId?: string;
      partnerId?: string;
      commissionNote?: string;
      disclaimer?: string;
      referralParam?: string;
    };

    // Styling
    styling: PromoStyling;
  };

  analytics?: {
    impressions: number;
    clicks: number;
    lastImpressionAt?: string;
  };

  createdAt: string;
  updatedAt: string;
}

export interface PromotionSettings {
  id: string;
  globalEnabled: boolean;
  tickersEnabled: boolean;
  mediaEnabled: boolean;
  gamificationEnabled: boolean;
  affiliatePromosEnabled: boolean;
  auditLog: Array<{
    action: string;
    performedBy: string;
    timestamp: string;
    notes?: string;
  }>;
  updatedAt: string;
}

export interface AffiliateCampaign {
  id: string;
  slug: string;
  name: string;
  partnerId?: string;
  partnerName?: string;
  status: "draft" | "active" | "paused" | "ended";
  enabled: boolean;
  schedule?: {
    startDate?: string;
    endDate?: string;
  };
  heroTitle: string;
  heroSubtitle?: string;
  heroDescription?: string;
  heroMediaUrl?: string;
  heroMediaType?: "image" | "video";
  tickerIds?: string[];
  promoBannerIds?: string[];
  featuredProductIds?: string[];
  commissionRate?: number;
  couponCode?: string;
  ctaText?: string;
  ctaLink?: string;
  faqs?: Array<{ question: string; answer: string }>;
  trustBullets?: string[];
  seoTitle?: string;
  seoDescription?: string;
  trackingKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromoRenderContext {
  pageType?: string;
  route?: string;
  category?: string;
  productId?: string;
  sku?: string;
  affiliateCampaignId?: string;
  device?: DeviceTarget;
  cartSubtotal?: number;
  isLoggedIn?: boolean;
}
