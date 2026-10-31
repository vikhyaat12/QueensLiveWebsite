"use client";

/**
 * Queens Care — Account Page (branch only, new file)
 *
 * FIXES AUDIT ISSUE: the main-branch Account wrapper (113 chars)
 * imported no header/footer. This version renders QueensSiteHeader.
 * Orders, addresses and profile data come via props from existing
 * account/order APIs. No order, total or address is invented.
 */

import Link from "next/link";
import QueensSectionShell from "./QueensSectionShell";
import QueensSiteHeader from "./QueensSiteHeader";

export type QueensOrderSummary = { id: string; date?: string; total?: number; status?: string; href?: string };

type Props = {
  customerName?: string;
  orders?: QueensOrderSummary[];
  cartCount?: number;
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function QueensAccountPage({ customerName, orders = [], cartCount = 0 }: Props) {
  return (
    <main>
      <QueensSiteHeader cartCount={cartCount} />
      <QueensSectionShell eyebrow="My account" title={customerName ? `Welcome, ${customerName}` : "My account"} subtitle="Your orders and account, from the existing account system.">
        <div className="queens-account-actions">
          <Link href="/shop" className="queens-btn queens-btn-gold">Shop Bestsellers →</Link>
          <Link href="/cart" className="queens-btn queens-btn-outline">View Cart</Link>
          <Link href="/contact" className="queens-btn queens-btn-outline">Contact Support</Link>
        </div>
        <h3>Your orders</h3>
        {orders.length === 0 ? (
          <p>No orders yet. Your orders from the existing order system will appear here.</p>
        ) : (
          <div className="queens-orders">
            {orders.map((o) => (
              <article key={o.id} className="queens-card queens-order-card">
                <strong>Order {o.id}</strong>
                {o.date ? <p>{o.date}</p> : null}
                {o.status ? <p>Status: {o.status}</p> : null}
                {typeof o.total === "number" ? <p>Total: {formatPrice(o.total)}</p> : null}
                {o.href ? <Link href={o.href} className="queens-btn queens-btn-outline">View Order</Link> : null}
              </article>
            ))}
          </div>
        )}
      </QueensSectionShell>
      <style>{`
        .queens-account-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 28px; }
        .queens-account-actions a { text-decoration: none; }
        .queens-orders { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; }
        .queens-order-card { padding: 20px; display: grid; gap: 8px; }
      `}</style>
    </main>
  );
}
