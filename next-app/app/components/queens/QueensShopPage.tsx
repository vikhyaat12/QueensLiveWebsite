"use client";

/**
 * Queens Care — Shop Page (branch only, new file)
 *
 * Data-driven only: products and categories come via props from
 * /api/products (existing API). Filtering/sorting here is client-side
 * presentation over that real data; it does not invent products,
 * prices, stock or ratings. Rating shows only if supplied on the
 * product (see QueensProductCard). One primary gold CTA per card is
 * Add to Cart; the page-level primary CTA is Shop/Search, not a
 * second competing buy button.
 */

import { useMemo, useState } from "react";
import QueensProductCard, { type QueensProductCardProduct } from "./QueensProductCard";
import QueensCategoryShowcase, { type QueensCategory } from "./QueensCategoryShowcase";
import QueensSectionShell from "./QueensSectionShell";
import QueensSiteHeader from "./QueensSiteHeader";

type Props = {
  products: QueensProductCardProduct[];
  categories?: QueensCategory[];
  onAddToCart?: (product: QueensProductCardProduct) => void;
  cartCount?: number;
};

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

export default function QueensShopPage({ products, categories = [], onAddToCart, cartCount = 0 }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("featured");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => (!q || p.name.toLowerCase().includes(q)));
    // Category filtering is only applied when the caller supplies a
    // category slug on products via a future prop; without it, the
    // chip row is a navigation aid to /categories/<slug> and does not
    // silently hide products. Keep the full list visible by default.
    void category;
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, query, sort, category]);
  return (
    <main>
      <QueensSiteHeader cartCount={cartCount} />
      <QueensSectionShell eyebrow="Shop" title="Shop Queens Care" subtitle="Real catalogue, real prices, real stock — loaded from the existing catalogue API.">
        <div className="queens-shop-tools">
          <label>Search products
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" />
          </label>
          <label>Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
        {categories.length > 0 ? <QueensCategoryShowcase categories={categories} /> : null}
        {visible.length === 0 ? (
          <p>No products match your search. Try a different search term, or browse all products.</p>
        ) : (
          <div className="queens-shop-grid">
            {visible.map((product, i) => (
              <div key={product.slug} style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }} className="queens-shop-card">
                <QueensProductCard product={product} productHref={`/products/${product.slug}`} onAddToCart={onAddToCart} />
              </div>
            ))}
          </div>
        )}
      </QueensSectionShell>
      <div className="queens-sticky-cta"><span>Ready to shop?</span><a className="queens-btn queens-btn-gold" href="/cart">View Cart</a></div>
      <style>{`
        .queens-shop-tools { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
        .queens-shop-tools label { font-weight: 700; color: #2a0f3a; display: grid; gap: 6px; }
        .queens-shop-tools input, .queens-shop-tools select { padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(42,15,58,.2); min-width: 220px; }
        .queens-shop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; margin-top: 24px; }
        .queens-shop-card { animation: queensShopUp .5s ease both; }
        @keyframes queensShopUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .queens-sticky-cta { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); background: #2a0f3a; color: #fff; padding: 12px 18px; border-radius: 999px; display: flex; gap: 12px; align-items: center; z-index: 30; box-shadow: 0 18px 40px rgba(0,0,0,.3); }
        @media (prefers-reduced-motion: reduce) { .queens-shop-card { animation: none; } }
      `}</style>
    </main>
  );
}
