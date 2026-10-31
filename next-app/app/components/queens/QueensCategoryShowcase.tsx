"use client";

/**
 * Queens Care — Category Showcase (data-driven only)
 *
 * Categories must come from the real catalogue (/api/products categories
 * or the existing category pages). No category name, image or count is
 * invented here. Mobile: horizontal scroll. Desktop: refined grid.
 * Images are lazy-loaded except when the caller marks the section as
 * above the fold.
 */

import Link from "next/link";

export type QueensCategory = {
  name: string;
  slug: string;
  href: string;
  image?: string;
  productCount?: number;
};

type Props = {
  categories: QueensCategory[];
};

export default function QueensCategoryShowcase({ categories }: Props) {
  if (!categories.length) return null;
  return (
    <div className="queens-category-grid">
      {categories.map((category) => (
        <Link key={category.slug} href={category.href} className="queens-card queens-category-card">
          {category.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={category.image} alt={category.name} width={480} height={360} loading="lazy" />
          ) : null}
          <span className="queens-category-body">
            <strong>{category.name}</strong>
            {typeof category.productCount === "number" ? (
              <small>{category.productCount} products</small>
            ) : null}
            <span aria-hidden="true">→</span>
          </span>
        </Link>
      ))}
      <style>{`
        .queens-category-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 640px) { .queens-category-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .queens-category-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; } }
        .queens-category-card { text-decoration: none; color: #2a0f3a; }
        .queens-category-card img { width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover; display: block; }
        .queens-category-body { display: flex; align-items: center; gap: 8px; padding: 16px; }
        .queens-category-body small { color: #6b6570; }
        .queens-category-body span:last-child { margin-left: auto; color: #c19a6b; font-weight: 700; }
      `}</style>
    </div>
  );
}
