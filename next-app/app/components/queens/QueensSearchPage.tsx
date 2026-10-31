"use client";

/**
 * Queens Care — Search Page (branch only, new file)
 * Results via props from /api/search (existing API). This page does
 * not merge Shop and Search logic — both entry points are kept, as
 * on main. No result, price or rating is invented.
 */

import Link from "next/link";
import QueensProductCard, { type QueensProductCardProduct } from "./QueensProductCard";
import QueensSectionShell from "./QueensSectionShell";
import QueensSiteHeader from "./QueensSiteHeader";

type Props = {
  query: string;
  products: QueensProductCardProduct[];
  onQueryChange?: (q: string) => void;
  onAddToCart?: (product: QueensProductCardProduct) => void;
  cartCount?: number;
};

export default function QueensSearchPage({ query, products, onQueryChange, onAddToCart, cartCount = 0 }: Props) {
  return (
    <main>
      <QueensSiteHeader cartCount={cartCount} />
      <QueensSectionShell eyebrow="Search" title={query ? `Results for "${query}"` : "Search Queens Care"}>
        <label className="queens-search-label">Search
          <input value={query} onChange={(e) => onQueryChange?.(e.target.value)} placeholder="Search products" />
        </label>
        {products.length === 0 ? (
          <div style={{ marginTop: 24 }}><p>No results found. Try a different term, or browse the shop.</p><Link href="/shop" className="queens-btn queens-btn-gold">Browse Shop →</Link></div>
        ) : (
          <div className="queens-search-grid">
            {products.map((p) => <QueensProductCard key={p.slug} product={p} productHref={`/products/${p.slug}`} onAddToCart={onAddToCart} />)}
          </div>
        )}
      </QueensSectionShell>
      <style>{`
        .queens-search-label { font-weight: 700; color: #2a0f3a; display: grid; gap: 6px; max-width: 520px; }
        .queens-search-label input { padding: 14px 16px; border-radius: 999px; border: 1px solid rgba(42,15,58,.25); font: inherit; }
        .queens-search-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; margin-top: 24px; }
      `}</style>
    </main>
  );
}
