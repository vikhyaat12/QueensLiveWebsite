"use client";

/**
 * Queens Care — FAQ Page (branch only, new file)
 * FAQ items via props from faqStore / /api/pages fallback, as on main.
 * No policy, guarantee or clinical answer is invented. The audit
 * flagged FAQ metadata wording ("guarantees / clinical quality") —
 * callers must pass only verified wording here.
 */

import QueensFaq, { type QueensFaqItem } from "./QueensFaq";
import QueensSectionShell from "./QueensSectionShell";
import QueensSiteHeader from "./QueensSiteHeader";

type Props = { items: QueensFaqItem[]; cartCount?: number };

export default function QueensFaqPage({ items, cartCount = 0 }: Props) {
  return (
    <main>
      <QueensSiteHeader cartCount={cartCount} />
      <QueensSectionShell eyebrow="Good to know" title="Frequently asked questions" subtitle="Answers from the existing FAQ data. Still stuck? Contact us — the link below is the primary help CTA.">
        {items.length === 0 ? <p>No FAQs are published right now.</p> : <QueensFaq items={items} />}
        <div style={{ marginTop: 32 }}>
          <a className="queens-btn queens-btn-gold" href="/contact">Contact Us →</a>
        </div>
      </QueensSectionShell>
    </main>
  );
}
