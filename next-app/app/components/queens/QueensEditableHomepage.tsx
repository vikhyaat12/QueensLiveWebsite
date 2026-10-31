/**
 * Queens Care — Editable Homepage (data-driven, no hardcoded content)
 *
 * How editing works, with the EXISTING admin system (no new admin):
 * - The page that uses this component loads hero + section data from
 *   the existing APIs: /api/homepage (sections) and /api/settings
 *   (brand, logo, navigation, footer).
 * - It converts the hero section with the helpers in
 *   @/lib/queens-homepage-content.ts and passes the result here.
 * - Changing headline, subtitle, hero product, character image,
 *   section order, visibility or CTAs in admin therefore changes this
 *   page — nothing here needs a code change for content edits.
 * - Products, categories, blog posts and testimonials are also loaded
 *   from their existing APIs, never hardcoded here.
 *
 * This component itself renders only what it is given. If admin returns
 * no hero, it renders no hero — it never invents a product, price,
 * claim or doctor credential.
 */

import QueensCrownQHero from "./QueensCrownQHero";
import QueensSectionShell from "./QueensSectionShell";
import QueensCategoryShowcase, { type QueensCategory } from "./QueensCategoryShowcase";
import QueensProductCard, { type QueensProductCardProduct } from "./QueensProductCard";
import QueensEditorialShowcase, { type QueensShowcaseProduct } from "./QueensEditorialShowcase";
import QueensFaq, { type QueensFaqItem } from "./QueensFaq";
import type { QueensHeroContent, QueensSectionContent } from "@/lib/queens-homepage-content";

type Props = {
  hero?: QueensHeroContent;
  sections?: QueensSectionContent[];
  categories?: QueensCategory[];
  featuredProducts?: QueensProductCardProduct[];
  showcaseProduct?: QueensShowcaseProduct;
  showcaseHref?: string;
  faqItems?: QueensFaqItem[];
  onAddToCart?: (product: QueensProductCardProduct) => void;
};

export default function QueensEditableHomepage({
  hero,
  sections = [],
  categories = [],
  featuredProducts = [],
  showcaseProduct,
  showcaseHref,
  faqItems = [],
  onAddToCart,
}: Props) {
  const sectionVisible = (type: string) =>
    sections.length === 0 || sections.some((s) => s.type === type && s.active !== false && s.visible !== false);

  return (
    <main>
      {hero ? (
        <QueensCrownQHero
          headline={hero.headline}
          subtitle={hero.subtitle ?? hero.description}
          logoImage={hero.character.image}
          bottleImage={hero.heroProductImage}
          primaryCta={hero.primaryCta}
          secondaryCta={hero.secondaryCta}
          productHref={hero.heroProductSlug ? `/products/${hero.heroProductSlug}` : undefined}
        />
      ) : null}

      {categories.length > 0 && sectionVisible("collection") ? (
        <QueensSectionShell eyebrow="Shop by Category" title="Find your care, your way">
          <QueensCategoryShowcase categories={categories} />
        </QueensSectionShell>
      ) : null}

      {featuredProducts.length > 0 ? (
        <QueensSectionShell eyebrow="Featured Products" title="Loved by Queens">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {featuredProducts.map((product) => (
              <QueensProductCard
                key={product.slug}
                product={product}
                productHref={`/products/${product.slug}`}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </QueensSectionShell>
      ) : null}

      {showcaseProduct && showcaseHref ? (
        <QueensSectionShell eyebrow="Signature Showcase" title={showcaseProduct.name} background="ivory">
          <QueensEditorialShowcase product={showcaseProduct} productHref={showcaseHref} />
        </QueensSectionShell>
      ) : null}

      {faqItems.length > 0 ? (
        <QueensSectionShell eyebrow="Good to know" title="Frequently asked questions">
          <QueensFaq items={faqItems} />
        </QueensSectionShell>
      ) : null}
    </main>
  );
}
