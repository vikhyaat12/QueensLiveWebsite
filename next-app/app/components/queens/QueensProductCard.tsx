"use client";

/**
 * Queens Care — Premium Product Card (data-driven only)
 *
 * Rules:
 * - All product data comes from props, which the page must load from
 *   the real catalogue API. No hardcoded product, price or rating here.
 * - Discount is calculated from the real selling price and MRP only,
 *   and only when MRP is greater than the selling price.
 * - Rating is shown only when a genuine rating is supplied.
 * - Stock is shown from the real `inStock` value, never invented.
 * - Add to Cart does not invent cart logic: the page passes its existing
 *   `onAddToCart` handler (the app's existing client-cart flow).
 */

import Link from "next/link";

export type QueensProductCardProduct = {
  name: string;
  slug: string;
  image: string;
  price: number;
  mrp?: number;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
};

type Props = {
  product: QueensProductCardProduct;
  productHref: string;
  onAddToCart?: (product: QueensProductCardProduct) => void;
  adding?: boolean;
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function QueensProductCard({ product, productHref, onAddToCart, adding }: Props) {
  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <article className="queens-card queens-product-card">
      <Link href={productHref} aria-label={product.name} className="queens-product-image-link">
        {/* Original uploaded product image only. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} width={480} height={480} loading="lazy" />
        {discount > 0 ? <span className="queens-product-discount">{discount}% off</span> : null}
      </Link>

      <div className="queens-product-body">
        <h3 className="queens-product-name">
          <Link href={productHref}>{product.name}</Link>
        </h3>

        <p className="queens-product-price">
          <strong>{formatPrice(product.price)}</strong>
          {product.mrp && product.mrp > product.price ? (
            <s>{formatPrice(product.mrp)}</s>
          ) : null}
        </p>

        {typeof product.rating === "number" ? (
          <p className="queens-product-rating" aria-label={`Rated ${product.rating} out of 5`}>
            ★ {product.rating.toFixed(1)}
            {typeof product.reviewCount === "number" ? ` (${product.reviewCount})` : ""}
          </p>
        ) : null}

        <p className={`queens-product-stock ${product.inStock === false ? "out" : ""}`}>
          {product.inStock === false ? "Out of stock" : "In stock"}
        </p>

        <button
          type="button"
          className="queens-btn queens-btn-primary queens-product-add"
          disabled={product.inStock === false || adding}
          onClick={() => onAddToCart?.(product)}
        >
          {adding ? "Adding…" : "Add to Cart"}
        </button>
      </div>

      <style>{`
        .queens-product-card { display: flex; flex-direction: column; }
        .queens-product-image-link { position: relative; display: block; background: #faf7f1; }
        .queens-product-image-link img { width: 100%; height: auto; aspect-ratio: 1; object-fit: cover; display: block; }
        .queens-product-discount { position: absolute; top: 12px; left: 12px; background: #2a0f3a; color: #fff; font-size: 12px; font-weight: 700; padding: 6px 10px; border-radius: 999px; }
        .queens-product-body { padding: 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .queens-product-name { font-size: 16px; line-height: 1.4; margin: 0; }
        .queens-product-name a { color: #2a0f3a; text-decoration: none; }
        .queens-product-price { margin: 0; display: flex; gap: 8px; align-items: baseline; }
        .queens-product-price s { color: #6b6570; font-size: 14px; }
        .queens-product-rating { margin: 0; color: #c19a6b; font-weight: 700; font-size: 14px; }
        .queens-product-stock { margin: 0; font-size: 13px; color: #2a6b3a; }
        .queens-product-stock.out { color: #9b2c2c; }
        .queens-product-add { margin-top: auto; width: 100%; }
      `}</style>
    </article>
  );
}
