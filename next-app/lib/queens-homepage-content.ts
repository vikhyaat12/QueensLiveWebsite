/**
 * Queens Care — Homepage Content Model (admin-integration contract)
 *
 * Purpose: one clear, data-driven shape for every homepage element that
 * the EXISTING admin panel will own later. No new admin panel, no new
 * auth, no duplicate product/content database is created here.
 *
 * How it maps to the existing app today:
 * - Homepage sections already arrive from `/api/homepage` as
 *   { id, type, active, visible, sort, content } where content is JSON.
 *   Use `toHomepageSection()` when saving a section back through that API.
 * - Global brand settings already arrive from `/api/settings`
 *   (theme_primary, theme_gold, theme_accent, theme_bg, theme_text,
 *   logo_url, header_nav, footer_links, footer_*).
 * - Products, categories, blog posts and testimonials already arrive from
 *   `/api/products`, `/api/blog` and `/api/testimonials`.
 * - This file only TYPES that data. It never hardcodes a product, price,
 *   claim, certification or legal statement.
 *
 * Character / product honesty rules (from the master spec):
 * - The female character is a fictional brand guide, not a real doctor
 *   and not a medical adviser. Never attach credentials or medical advice.
 * - The hero product image must be the original uploaded product image.
 *   Never regenerate, relabel or distort it.
 * - If a genuine GLB/GLTF character or bottle model is supplied later,
 *   set `character.modelUrl` / `hero.productModelUrl` and the hero will
 *   use the asset-ready slot. Until then the hero uses the original
 *   image with layered CSS/3D effects and must NOT be described as a
 *   fully rigged 3D character or a fully accurate 3D bottle.
 */

export type QueensCta = {
  label: string;
  href: string;
};

export type QueensCharacterContent = {
  /** Original character image, e.g. "/images/hero/dr-queens-hd.webp". */
  image: string;
  /** Mobile-specific image, if different. Falls back to `image`. */
  mobileImage?: string;
  /** Optional future GLB/GLTF model. Empty until a real model is supplied. */
  modelUrl?: string;
  position?: "left" | "center" | "right";
  scale?: number;
  visible?: boolean;
  animationEnabled?: boolean;
  animationIntensity?: number; // 0 = off, 1 = normal, keep <= 1.5
};

export type QueensHeroContent = {
  headline: string;
  subtitle?: string;
  description?: string;
  background?: string;
  character: QueensCharacterContent;
  /** Slug of the hero product, resolved against /api/products. */
  heroProductSlug?: string;
  /** Original product image. Never a regenerated bottle. */
  heroProductImage?: string;
  /** Optional future GLB/GLTF bottle model. Empty until a real model exists. */
  heroProductModelUrl?: string;
  primaryCta?: QueensCta;
  secondaryCta?: QueensCta;
  animationEnabled?: boolean;
  animationIntensity?: number;
  displayOrder?: number;
};

export type QueensSectionContent = {
  id: string;
  type:
    | "hero"
    | "collection"
    | "science"
    | "trust"
    | "ritual"
    | "consult"
    | "faq"
    | "newsletter"
    | "banner"
    | "marquee";
  title?: string;
  subtitle?: string;
  image?: string;
  video?: string;
  background?: string;
  content?: Record<string, unknown>;
  primaryCta?: QueensCta;
  secondaryCta?: QueensCta;
  active?: boolean;
  visible?: boolean;
  sort?: number;
};

export type QueensGlobalSettings = {
  brandColors?: {
    purple?: string;
    gold?: string;
    white?: string;
    charcoal?: string;
  };
  typography?: { serif?: string; sans?: string };
  logoUrl?: string;
  navigation?: Array<{ label: string; href: string; visible: boolean; sort: number }>;
  footerLinks?: Array<{
    section: string;
    links: Array<{ label: string; href: string; visible: boolean; sort: number }>;
  }>;
  announcementBar?: { text?: string; visible?: boolean };
  socialLinks?: Array<{ platform: string; label: string; url: string }>;
};

/** Existing /api/homepage section shape, for save-back compatibility. */
export type QueensHomepageApiSection = {
  id: string;
  type: string;
  active: boolean;
  visible: boolean;
  sort: number;
  content: string;
};

export function toHomepageSection(section: QueensSectionContent): QueensHomepageApiSection {
  return {
    id: section.id,
    type: section.type,
    active: section.active !== false,
    visible: section.visible !== false,
    sort: section.sort ?? 0,
    content: JSON.stringify({
      title: section.title,
      subtitle: section.subtitle,
      image: section.image,
      video: section.video,
      background: section.background,
      primaryCta: section.primaryCta,
      secondaryCta: section.secondaryCta,
      ...(section.content ?? {}),
    }),
  };
}

/**
 * Safe defaults only — no product, price or claim is invented here.
 * A page must pass real hero/product data from the APIs; these defaults
 * only keep the layout from crashing if the API returns nothing, and the
 * hero component renders an empty state rather than a fake product.
 */
export const QUEENS_HERO_FALLBACK_IMAGE = "/images/hero/dr-queens-hd.webp";
export const QUEENS_HERO_PRODUCT_FALLBACK_IMAGE = "/images/hero/likoq-hero-staged.webp";
