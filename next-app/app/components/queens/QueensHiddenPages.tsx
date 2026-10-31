"use client";

/**
 * Queens Care — Hidden Pages Template (branch only, new file)
 *
 * One reusable premium template for pages that are not in the main
 * navigation: Affiliate, B2B, Careers, Health A-Z, Manufacturing,
 * Quality Assurance, Research & Development, Trust, Store Locator,
 * Quiz, Terms, Privacy, Shipping, Returns.
 *
 * EVERYTHING is via props. This component invents no content for
 * any of those pages: if a page has no approved copy, the caller
 * must not render it with placeholder text — it should render the
 * empty state below, or not link the page at all, until real copy
 * is supplied from /api/pages or the existing content store.
 * Science is intentionally NOT in this list as a main item; the
 * existing Science page on main is not deleted and not redesigned
 * here, per the brief.
 */

import QueensSectionShell from "./QueensSectionShell";
import QueensSiteHeader from "./QueensSiteHeader";

export type QueensHiddenSection = { heading: string; body: string; cta?: { label: string; href: string } };

export const QUEENS_HIDDEN_PAGE_KEYS = [
  "Affiliate", "B2B", "Careers", "Health A-Z", "Manufacturing",
  "Quality Assurance", "Research & Development", "Trust",
  "Store Locator", "Quiz", "Terms", "Privacy", "Shipping", "Returns",
] as const;

type Props = {
  pageKey: string;
  title: string;
  intro?: string;
  sections?: QueensHiddenSection[];
  primaryCta?: { label: string; href: string };
  cartCount?: number;
};

export default function QueensHiddenPages({ pageKey, title, intro, sections = [], primaryCta, cartCount = 0 }: Props) {
  return (
    <main>
      <QueensSiteHeader cartCount={cartCount} />
      <QueensSectionShell eyebrow="Queens Care" title={title} subtitle={intro} primaryCta={primaryCta}>
        {sections.length === 0 ? (
          <p>Content for {pageKey} has not been published yet. Please check back, or contact us for help.</p>
        ) : (
          <div className="queens-hidden-sections">
            {sections.map((s, i) => (
              <article key={s.heading} className="queens-card queens-hidden-card" style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}>
                <h3>{s.heading}</h3>
                <p>{s.body}</p>
                {s.cta ? <a className="queens-btn queens-btn-outline" href={s.cta.href}>{s.cta.label}</a> : null}
              </article>
            ))}
          </div>
        )}
        <div style={{ marginTop: 28 }}>
          <a className="queens-btn queens-btn-gold" href="/shop">Shop Bestsellers →</a>
        </div>
      </QueensSectionShell>
      <style>{`
        .queens-hidden-sections { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .queens-hidden-card { padding: 22px; animation: queensHiddenUp .5s ease both; }
        .queens-hidden-card p { line-height: 1.7; }
        @keyframes queensHiddenUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .queens-hidden-card { animation: none; } }
      `}</style>
    </main>
  );
}
