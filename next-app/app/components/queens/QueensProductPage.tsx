"use client";

/**
 * Queens Care — Product Detail Page (branch only, new file)
 *
 * All product data via props from the existing product store/API.
 * No price, MRP, stock, rating, delivery estimate, ingredient or
 * benefit claim is invented here. Gallery images are the original
 * product images supplied via props. Delivery info, recommendations
 * and FAQ are slots: render only when the caller supplies real data.
 * Purchase behaviour is delegated to the caller's existing
 * onAddToCart handler; this file adds no pricing, GST, inventory or
 * prescription logic.
 */

import type { ReactNode } from "react";
import QueensProductCard, { type QueensProductCardProduct } from "./QueensProductCard";
import QueensFaq, { type QueensFaqItem } from "./QueensFaq";
import QueensSectionShell from "./QueensSectionShell";
import QueensSiteHeader from "./QueensSiteHeader";

export type QueensProductDetail = {
  name: string;
  slug: string;
  images: string[];
  price: number;
  mrp?: number;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  description?: string;
  highlights?: string[];
  // URGENCY RULE: only render a badge when the caller passes a
  // genuinely computed value from real inventory/admin data.
  // Never pass a hardcoded "only X left" or countdown here.
  urgencyBadge?: string;
};

type Props = {
  product: QueensProductDetail;
  recommendations?: QueensProductCardProduct[];
  faqItems?: QueensFaqItem[];
  deliveryInfo?: ReactNode;
  onAddToCart?: (product: QueensProductCardProduct) => void;
  cartCount?: number;
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function QueensProductPage({ product, recommendations = [], faqItems = [], deliveryInfo, onAddToCart, cartCount = 0 }: Props) {
  const discount = product.mrp && product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  return (
    <main>
      <QueensSiteHeader cartCount={cartCount} />
      <div className="queens-container queens-product-layout">
        <div className="queens-product-gallery">
          {product.images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt={`${product.name} image ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} />
          ))}
        </div>
        <div className="queens-product-buy">
          <p className="queens-eyebrow">Product</p>
          <h1>{product.name}</h1>
          {product.urgencyBadge ? <p className="queens-urgency">{product.urgencyBadge}</p> : null}
          <p className="queens-product-price"><strong>{formatPrice(product.price)}</strong>{product.mrp && product.mrp > product.price ? <s>{formatPrice(product.mrp)}</s> : null}{discount > 0 ? <span>{discount}% off</span> : null}</p>
          {typeof product.rating === "number" ? <p>★ {product.rating.toFixed(1)}{typeof product.reviewCount === "number" ? ` (${product.reviewCount})` : ""}</p> : null}
          <p>{product.inStock === false ? "Out of stock" : "In stock"}</p>
          {product.description ? <p className="queens-product-desc">{product.description}</p> : null}
          {product.highlights?.length ? <ul>{product.highlights.map((h) => <li key={h}>{h}</li>)}</ul> : null}
          <button type="button" className="queens-btn queens-btn-gold queens-product-cta" disabled={product.inStock === false} onClick={() => onAddToCart?.({ name: product.name, slug: product.slug, image: product.images[0] ?? "", price: product.price, mrp: product.mrp, rating: product.rating, reviewCount: product.reviewCount, inStock: product.inStock })}>
            Add to Cart
          </button>
          <a className="queens-btn queens-btn-outline" href="/cart">View Cart</a>
          {deliveryInfo ? <div className="queens-delivery">{deliveryInfo}</div> : null}
          <p className="queens-brand-note">A friendly brand guide — not a medical adviser. Follow the product label and your clinician&apos;s advice where applicable.</p>
        </div>
      </div>
      {recommendations.length > 0 ? (
        <QueensSectionShell eyebrow="You may also like" title="More from Queens">
          <div className="queens-rec-grid">
            {recommendations.map((p) => <QueensProductCard key={p.slug} product={p} productHref={`/products/${p.slug}`} onAddToCart={onAddToCart} />)}
          </div>
        </QueensSectionShell>
      ) : null}
      {faqItems.length > 0 ? (
        <QueensSectionShell eyebrow="Good to know" title="Questions about this product"><QueensFaq items={faqItems} /></QueensSectionShell>
      ) : null}
      <style>{`
        .queens-product-layout { display: grid; grid-template-columns: 1fr; gap: 28px; padding-block: 32px; }
        @media (min-width: 900px) { .queens-product-layout { grid-template-columns: 1fr 1fr; } }
        .queens-product-gallery img { width: 100%; height: auto; border-radius: 20px; display: block; margin-bottom: 12px; }
        .queens-product-buy h1 { font-family: Georgia, serif; font-size: clamp(1.9rem, 4vw, 3rem); line-height: 1.1; color: #2a0f3a; }
        .queens-product-price { display: flex; gap: 10px; align-items: baseline; font-size: 1.25rem; }
        .queens-product-price s { color: #6b6570; font-size: 1rem; }
        .queens-product-desc { line-height: 1.7; }
        .queens-product-cta { width: 100%; margin: 12px 0; }
        .queens-urgency { background: #faf7f1; border: 1px solid rgba(193,154,107,.5); padding: 10px 14px; border-radius: 12px; font-weight: 700; color: #2a0f3a; }
        .queens-delivery { margin-top: 20px; background: #faf7f1; padding: 16px; border-radius: 16px; }
        .queens-brand-note { font-size: 13px; color: #6b6570; }
        .queens-rec-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
      `}</style>
    </main>
  );
}
