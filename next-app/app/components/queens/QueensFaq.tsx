"use client";

/**
 * Queens Care — Premium FAQ (data-driven only)
 *
 * Questions and answers must come from genuine business policies and
 * approved information supplied by the page (existing FAQ data).
 * No legal, regulatory or medical answer is invented here.
 * Uses native <details> so it works without JavaScript and is
 * keyboard-accessible by default.
 */

export type QueensFaqItem = {
  question: string;
  answer: string;
};

type Props = {
  items: QueensFaqItem[];
};

export default function QueensFaq({ items }: Props) {
  if (!items.length) return null;
  return (
    <div className="queens-faq">
      {items.map((item) => (
        <details key={item.question} className="queens-faq-item">
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
      <style>{`
        .queens-faq { display: grid; gap: 12px; }
        .queens-faq-item { background: #fff; border: 1px solid rgba(42,15,58,.1); border-radius: 16px; padding: 16px 20px; }
        .queens-faq-item summary { cursor: pointer; font-weight: 700; color: #2a0f3a; list-style: none; display: flex; justify-content: space-between; gap: 16px; }
        .queens-faq-item summary::after { content: "+"; color: #c19a6b; font-weight: 700; }
        .queens-faq-item[open] summary::after { content: "−"; }
        .queens-faq-item summary:focus-visible { outline: 3px solid rgba(193,154,107,.55); outline-offset: 3px; border-radius: 8px; }
        .queens-faq-item p { margin: 12px 0 0; line-height: 1.7; color: #333; }
      `}</style>
    </div>
  );
}
