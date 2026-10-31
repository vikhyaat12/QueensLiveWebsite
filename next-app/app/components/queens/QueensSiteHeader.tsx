"use client";

/**
 * Queens Care — Site Header (branch only, new file)
 *
 * - Logo is the original Queens Care logo file verbatim, passed via
 *   logoSrc (default /images/hero/queens-care-logo.png). It is never
 *   redrawn, regenerated or altered here.
 * - `logoRight` places the logo on the right side of the header, as
 *   requested for the hero/header layout. Default is logo-right.
 * - Navigation EXCLUDES Science, per the redesign brief. Science page
 *   on main is NOT deleted by this component; it is simply not linked.
 * - Nav items, cart count and auth state come via props from existing
 *   settings/auth APIs. No nav item is hardcoded as a content claim.
 * - Mobile menu is a <details>-free button toggle for accessibility;
 *   it works with keyboard focus and has reduced-motion safe styles.
 */

import Link from "next/link";
import { useState } from "react";

export type QueensNavItem = { label: string; href: string };

export const QUEENS_DEFAULT_NAV: QueensNavItem[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Doctors", href: "/doctors" },
  { label: "Blog", href: "/blog" },
  { label: "People", href: "/employee" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Search", href: "/search" },
];

type Props = {
  nav?: QueensNavItem[];
  logoSrc?: string;
  logoRight?: boolean;
  cartCount?: number;
  accountHref?: string;
};

export default function QueensSiteHeader({
  nav = QUEENS_DEFAULT_NAV,
  logoSrc = "/images/hero/queens-care-logo.png",
  logoRight = true,
  cartCount = 0,
  accountHref = "/account",
}: Props) {
  const [open, setOpen] = useState(false);
  const logo = (
    <Link href="/" aria-label="Queens Care home" className="queens-header-logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoSrc} alt="Queens Care Laboratories logo" width={180} height={80} />
    </Link>
  );
  return (
    <header className="queens-site-header">
      <div className="queens-container queens-header-row">
        {!logoRight ? logo : null}
        <nav aria-label="Primary" className="queens-header-nav">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </nav>
        <div className="queens-header-actions">
          <Link href={accountHref} className="queens-header-account">Account</Link>
          <Link href="/cart" className="queens-btn queens-btn-gold queens-header-cart" aria-label={`Cart, ${cartCount} items`}>
            Cart ({cartCount})
          </Link>
          <button type="button" className="queens-header-menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            Menu
          </button>
        </div>
        {logoRight ? logo : null}
      </div>
      {open ? (
        <nav aria-label="Mobile" className="queens-container queens-header-mobile">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
          ))}
        </nav>
      ) : null}
      <style>{`
        .queens-site-header { background: #fff; border-bottom: 1px solid rgba(42,15,58,.1); position: sticky; top: 0; z-index: 40; }
        .queens-header-row { display: flex; align-items: center; gap: 20px; padding-block: 10px; flex-wrap: wrap; }
        .queens-header-logo img { height: 56px; width: auto; display: block; }
        .queens-header-nav { display: flex; gap: 16px; flex-wrap: wrap; }
        .queens-header-nav a { color: #2a0f3a; text-decoration: none; font-weight: 600; }
        .queens-header-actions { margin-left: auto; display: flex; gap: 12px; align-items: center; }
        .queens-header-account { color: #2a0f3a; font-weight: 600; text-decoration: none; }
        .queens-header-cart { text-decoration: none; }
        .queens-header-menu { display: none; }
        .queens-header-mobile { display: none; }
        @media (max-width: 768px) {
          .queens-header-nav { display: none; }
          .queens-header-menu { display: inline-block; background: #2a0f3a; color: #fff; border: 0; border-radius: 999px; padding: 10px 16px; font-weight: 700; }
          .queens-header-mobile { display: grid; gap: 10px; padding-bottom: 16px; }
          .queens-header-mobile a { color: #2a0f3a; font-weight: 600; text-decoration: none; }
        }
        @media (prefers-reduced-motion: reduce) { .queens-site-header * { transition: none !important; } }
      `}</style>
    </header>
  );
}
