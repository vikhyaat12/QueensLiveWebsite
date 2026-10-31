/**
 * Queens Care — Luxury Home Redesign (conversion + trust first)
 *
 * Post-audit Home redesign, main branch audit 2026-10-31.
 * Structure, in conversion order:
 * 1. Doctor-First cinematic hero (no bottle stage) with ONE primary CTA
 * 2. Trust strip — only verified system facts: secure checkout methods
 *    already in checkout code (UPI, Cards, NetBanking, COD), real
 *    admin-verified catalogue, simple Shop -> Cart -> Checkout path.
 *    No invented rating, review count, guarantee or certification.
 * 3. Shop by Category (real categories via props)
 * 4. Featured Products (real products via props, real price/stock)
 * 5. Why Queens / Science (verified copy only)
 * 6. Testimonials (real testimonials via props only — render nothing
 *    if none are supplied, never fake reviews)
 * 7. FAQ (real FAQ items via props only)
 * 8. Sticky Shop Now CTA on mobile/desktop
 *
 * All content comes via props from existing admin APIs
 * (/api/homepage, /api/settings, /api/products, /api/testimonials).
 * Doctor: original logo by default. A recreated doctor variant may
 * be passed as logoImage only after the user approves that new look;
 * do not replace the live logo with a generated image silently.
 */

import QueensDoctorFirstHero from "./QueensDoctorFirstHero";
import QueensSectionShell from "./QueensSectionShell";
import QueensCategoryShowcase, { type QueensCategory } from "./QueensCategoryShowcase";
import QueensProductCard, { type QueensProductCardProduct } from "./QueensProductCard";
import QueensFaq, { type QueensFaqItem } from "./QueensFaq";
import type { QueensHeroContent } from "@/lib/queens-homepage-content";

type Testimonial = { quote: string; name?: string };

type Props = {
  hero?: QueensHeroContent;
  categories?: QueensCategory[];
  featuredProducts?: QueensProductCardProduct[];
  faqItems?: QueensFaqItem[];
  testimonials?: Testimonial[];
  onAddToCart?: (product: QueensProductCardProduct) => void;
};

export default function QueensLuxuryHome({ hero, categories = [], featuredProducts = [], faqItems = [], testimonials = [], onAddToCart }: Props) {
  return (
    <main>
      {hero ? (
        <QueensDoctorFirstHero
          headline={hero.headline}
          subtitle={hero.subtitle ?? hero.description}
          logoImage={hero.character.image}
          primaryCta={hero.primaryCta ?? { label: "Shop Bestsellers", href: "/shop" }}
          secondaryCta={hero.secondaryCta ?? { label: "Why Queens?", href: "#brand" }}
          categoryOrbs={categories.slice(0, 4).map((c) => ({ label: c.name, href: c.href }))}
        />
      ) : null}

      <div className="queens-trust-strip" role="list">
        <div role="listitem"><strong>Secure Checkout</strong><span>UPI · Cards · NetBanking · COD*</span></div>
        <div role="listitem"><strong>Real Catalogue</strong><span>Admin-verified products</span></div>
        <div role="listitem"><strong>Simple Path</strong><span>Shop → Cart → Checkout</span></div>
      </div>

      {categories.length > 0 ? (
        <QueensSectionShell eyebrow="Shop by Category" title="Find your care, fast">
          <QueensCategoryShowcase categories={categories} />
        </QueensSectionShell>
      ) : null}

      {featuredProducts.length > 0 ? (
        <QueensSectionShell eyebrow="Featured Products" title="Bestsellers">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {featuredProducts.map((product) => (
              <QueensProductCard key={product.slug} product={product} productHref={`/products/${product.slug}`} onAddToCart={onAddToCart} />
            ))}
          </div>
        </QueensSectionShell>
      ) : null}

      {testimonials.length > 0 ? (
        <QueensSectionShell eyebrow="Customers" title="What customers say">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {testimonials.map((t, i) => (
              <blockquote key={i} style={{ background: "#faf7f1", borderRadius: 18, padding: 22, margin: 0 }}>
                <p>{t.quote}</p>
                {t.name ? <footer>— {t.name}</footer> : null}
              </blockquote>
            ))}
          </div>
        </QueensSectionShell>
      ) : null}

      {faqItems.length > 0 ? (
        <QueensSectionShell eyebrow="Good to know" title="Frequently asked questions">
          <QueensFaq items={faqItems} />
        </QueensSectionShell>
      ) : null}

      <div className="queens-sticky-cta">
        <span>Ready to shop?</span>
        <a className="queens-btn queens-btn-gold" href="/shop">Shop Now</a>
      </div>
      <style jsx>{`
        .queens-trust-strip { max-width: 1040px; margin: -20px auto 0; background: #fff; border-radius: 18px; box-shadow: 0 18px 40px rgba(42,15,58,.18); padding: 16px 20px; display: flex; gap: 20px; flex-wrap: wrap; justify-content: space-between; position: relative; z-index: 2; }
        .queens-trust-strip strong { display: block; }
        .queens-trust-strip span { font-size: 12px; color: #6b6570; }
        .queens-sticky-cta { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); background: #2a0f3a; color: #fff; padding: 12px 18px; border-radius: 999px; display: flex; gap: 12px; align-items: center; z-index: 30; box-shadow: 0 18px 40px rgba(0,0,0,.3); }
      `}</style>
    </main>
  );
}
