/**
 * Queens Care — Checkout Chrome ONLY (branch only, new file)
 *
 * HARD BOUNDARY: this file contains NO payment, pricing, GST,
 * inventory, prescription, coupon, address or order logic. It only
 * wraps the caller's existing checkout children with the shared
 * header, a trust strip and the footer, so Checkout looks like the
 * rest of the redesigned site without touching its logic.
 *
 * The existing /checkout page (63k chars on main, 14 APIs, Razorpay,
 * Stripe, UPI, COD) must be restyled only by wrapping it in this
 * component, and only after a checkout regression run.
 */

import type { ReactNode } from "react";
import QueensSiteHeader from "./QueensSiteHeader";

type Props = {
  children: ReactNode;
  cartCount?: number;
  stepLabel?: string;
};

export default function QueensCheckoutChrome({ children, cartCount = 0, stepLabel }: Props) {
  return (
    <div className="queens-checkout-chrome">
      <QueensSiteHeader cartCount={cartCount} />
      <div className="queens-container queens-checkout-top">
        <p className="queens-eyebrow">Secure checkout</p>
        {stepLabel ? <p>{stepLabel}</p> : null}
        <div className="queens-checkout-trust" role="list">
          <span role="listitem">Secure Checkout</span>
          <span role="listitem">Shop → Cart → Checkout</span>
          <span role="listitem">Help: Contact / FAQ</span>
        </div>
      </div>
      <main className="queens-container queens-checkout-body">{children}</main>
      <footer className="queens-checkout-footer">
        <p>Queens Care Laboratories — checkout is handled by the existing checkout system. No payment details are stored by this wrapper.</p>
      </footer>
      <style>{`
        .queens-checkout-top { padding-block: 24px 8px; }
        .queens-checkout-trust { display: flex; gap: 10px; flex-wrap: wrap; }
        .queens-checkout-trust span { background: #faf7f1; border-radius: 999px; padding: 8px 14px; font-weight: 700; font-size: 13px; color: #2a0f3a; }
        .queens-checkout-body { padding-bottom: 48px; }
        .queens-checkout-footer { border-top: 1px solid rgba(42,15,58,.12); padding: 20px; text-align: center; color: #6b6570; font-size: 13px; }
      `}</style>
    </div>
  );
}
