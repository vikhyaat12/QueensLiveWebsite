"use client";

/**
 * Queens Care — Cart Page (branch only, new file)
 *
 * FIXES AUDIT ISSUE: the main-branch Cart page imported only the
 * footer, not the header. This version always renders
 * QueensSiteHeader, so a shopper can reach Home/Shop/Account without
 * using the browser back button.
 *
 * Cart lines, pricing and shipping are slots via props from the
 * existing cart/checkout APIs (/api/checkout/pricing,
 * /api/shipping/rules). No price, discount, shipping fee or total is
 * computed or invented here — the caller passes the server-computed
 * values. Checkout is a link to the existing /checkout flow.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import QueensSectionShell from "./QueensSectionShell";
import QueensSiteHeader from "./QueensSiteHeader";

export type QueensCartLine = {
  id: string;
  name: string;
  slug: string;
  image?: string;
  price: number;
  quantity: number;
};

type Props = {
  lines: QueensCartLine[];
  subtotal?: number;
  shipping?: number;
  total?: number;
  pricingNote?: ReactNode;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemove?: (id: string) => void;
  cartCount?: number;
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function QueensCartPage({ lines, subtotal, shipping, total, pricingNote, onUpdateQuantity, onRemove, cartCount }: Props) {
  const count = cartCount ?? lines.reduce((s, l) => s + l.quantity, 0);
  return (
    <main>
      <QueensSiteHeader cartCount={count} />
      <QueensSectionShell eyebrow="Your cart" title="Review your order">
        {lines.length === 0 ? (
          <div className="queens-cart-empty">
            <p>Your cart is empty.</p>
            <Link href="/shop" className="queens-btn queens-btn-gold">Shop Bestsellers</Link>
          </div>
        ) : (
          <>
            <div className="queens-cart-lines">
              {lines.map((line, i) => (
                <article key={line.id} className="queens-cart-line" style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}>
                  {line.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.image} alt={line.name} />
                  ) : null}
                  <div>
                    <h3><Link href={`/products/${line.slug}`}>{line.name}</Link></h3>
                    <p>{formatPrice(line.price)} × {line.quantity}</p>
                    <div className="queens-qty">
                      <button type="button" onClick={() => onUpdateQuantity?.(line.id, Math.max(1, line.quantity - 1))} aria-label="Decrease quantity">−</button>
                      <span>{line.quantity}</span>
                      <button type="button" onClick={() => onUpdateQuantity?.(line.id, line.quantity + 1)} aria-label="Increase quantity">+</button>
                      <button type="button" className="queens-remove" onClick={() => onRemove?.(line.id)}>Remove</button>
                    </div>
                  </div>
                  <strong>{formatPrice(line.price * line.quantity)}</strong>
                </article>
              ))}
            </div>
            <div className="queens-cart-summary">
              {typeof subtotal === "number" ? <p><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></p> : null}
              {typeof shipping === "number" ? <p><span>Shipping</span><strong>{formatPrice(shipping)}</strong></p> : null}
              {typeof total === "number" ? <p className="queens-total"><span>Total</span><strong>{formatPrice(total)}</strong></p> : null}
              {pricingNote}
              <Link href="/checkout" className="queens-btn queens-btn-gold queens-checkout-cta">Proceed to Checkout →</Link>
              <Link href="/shop" className="queens-btn queens-btn-outline">Continue Shopping</Link>
            </div>
          </>
        )}
      </QueensSectionShell>
      <style>{`
        .queens-cart-lines { display: grid; gap: 16px; }
        .queens-cart-line { display: grid; grid-template-columns: 80px 1fr auto; gap: 16px; align-items: center; background: #faf7f1; border-radius: 18px; padding: 16px; animation: queensCartUp .5s ease both; }
        .queens-cart-line img { width: 80px; height: 80px; object-fit: cover; border-radius: 12px; }
        .queens-cart-line h3 a { color: #2a0f3a; text-decoration: none; }
        .queens-qty { display: flex; gap: 8px; align-items: center; }
        .queens-qty button { border: 1px solid rgba(42,15,58,.2); background: #fff; border-radius: 999px; padding: 6px 12px; font-weight: 700; cursor: pointer; }
        .queens-remove { border: 0 !important; background: transparent !important; color: #9b2c2c; }
        .queens-cart-summary { margin-top: 24px; background: #fff; border: 1px solid rgba(42,15,58,.12); border-radius: 20px; padding: 20px; display: grid; gap: 10px; max-width: 480px; margin-left: auto; }
        .queens-cart-summary p { display: flex; justify-content: space-between; margin: 0; }
        .queens-total { font-size: 1.15rem; }
        .queens-checkout-cta { text-align: center; text-decoration: none; }
        @keyframes queensCartUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .queens-cart-line { animation: none; } }
      `}</style>
    </main>
  );
}
