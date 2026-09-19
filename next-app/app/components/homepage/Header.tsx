"use client";

import Link from "next/link";
import DeliveryTimer from "../DeliveryTimer";
import SearchOverlay from "../SearchOverlay";
import UniversalMarquee from "../UniversalMarquee";
import UniversalPromoRenderer from "../promotions/UniversalPromoRenderer";
import SocialMediaRenderer from "../social/SocialMediaRenderer";
import { useNavigation } from "../navigation/NavigationContext";
import type { HomeShared } from "./shared";

type HomeHeaderProps = {
  shared: HomeShared;
  bannerVisible: boolean;
  bannerContent: any;
  marqueeActive: boolean;
  marqueePlacement: string;
  marqueeItems: string[];
  marqueeSpeed: number;
  marqueeSeparator: string;
};

export default function HomeHeader({
  shared,
  bannerVisible,
  bannerContent,
  marqueeActive,
  marqueePlacement,
  marqueeItems,
  marqueeSpeed,
  marqueeSeparator,
}: HomeHeaderProps) {
  const { navItems: contextNav } = useNavigation();
  const isBannerVisible = bannerVisible;
  const isMarqueeActive = marqueeActive;
  const {
    menu, setMenu, headerNav,
    logoUrl, logoFailed, logoHeight, logoMaxWidth, logoRetryCount, setLogoRetryCount, setLogoFailed,
    searchOpen, setSearchOpen, startVoiceSearch, setStartVoiceSearch,
    wish, setNotice, cartCount, user,
  } = shared;
  return (
    <>
      {/* Global Top Promotions Slot */}
      <UniversalPromoRenderer slot="global_top" />

      {/* Global Announcement Slot (replaces static announcement text) */}
      <UniversalPromoRenderer
        slot="global_announcement"
        fallback={
          isBannerVisible ? (
            <div
              className="announcement"
              style={{
                background: bannerContent.backgroundColor ? String(bannerContent.backgroundColor) : "#1A0D28",
                color: bannerContent.textColor ? String(bannerContent.textColor) : "#F7F1EB",
                minHeight: 36,
                padding: "7px 4%",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <span>{bannerContent.text || "✦ Free Express Shipping on Orders Above ₹1,500"}</span>
                <span className="qc-announcement-extra" style={{ color: "#E9CA91", opacity: 0.9 }}>✦ 100% Original &amp; Trusted</span>
                <span className="qc-announcement-extra" style={{ color: "#E9CA91", opacity: 0.9 }}>✦ Scientifically Formulated</span>
                <span className="qc-announcement-extra" style={{ color: "#E9CA91", opacity: 0.9 }}>✦ Easy Returns</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <DeliveryTimer />
                <span className="qc-announcement-extra" style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", color: "#F7F1EB" }}>
                  🇮🇳 India (INR) ▾
                </span>
              </div>
            </div>
          ) : null
        }
      />

      {/* Universal Marquee — Above Header Placement Slot */}
      <UniversalPromoRenderer
        slot="global_above_header"
        fallback={
          isMarqueeActive && marqueePlacement === "above_header" ? (
            <UniversalMarquee
              items={marqueeItems}
              speed={marqueeSpeed}
              separator={marqueeSeparator}
              currentPlacement="above_header"
              placement="above_header"
            />
          ) : null
        }
      />

      <header className="nav-wrap">
        <Link href="/" className="brand" aria-label="Queens Care home" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt="Queens Care Laboratories"
              style={{ height: logoHeight || "42px", maxWidth: logoMaxWidth || "220px", objectFit: "contain", display: "block" }}
              onError={() => {
                if (logoRetryCount < 2) {
                  setTimeout(() => { setLogoRetryCount((c) => c + 1); setLogoFailed(false); }, 2000);
                } else {
                  setLogoFailed(true);
                }
              }}
            />
          ) : (
            <>
              <i>Q</i>
              <span>QUEENS<br/><b>CARE</b></span>
            </>
          )}
        </Link>
        <nav className={menu ? "open" : ""}>
          {((headerNav && headerNav.length > 0)
            ? headerNav.filter((n) => n.visible !== false).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
            : contextNav
          ).map((item) => {
            const isExternal = item.href.startsWith("http");
            if (isExternal) return <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">{item.label}</a>;
            if (item.href.startsWith("#")) return <a key={item.label} href={item.href}>{item.label}</a>;
            return <Link key={item.label} href={item.href}>{item.label}</Link>;
          })}
          <div className="qc-desktop-hide" style={{ borderTop: "1px solid rgba(42, 15, 58, 0.1)", paddingTop: 14, marginTop: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF", margin: "0 0 10px" }}>
              Connect with us
            </p>
            <SocialMediaRenderer placement="header" size={18} gap={12} variant="official" />
          </div>
        </nav>
        <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Header Social Icons (Desktop) */}
          <SocialMediaRenderer
            placement="header"
            size={16}
            gap={8}
            variant="monochrome"
            color="#6B7280"
            hoverColor="#2A0F3A"
            className="qc-mobile-hide"
            style={{ marginRight: 8 }}
          />

          {/* Mobile Search Icon Button */}
          <button
            type="button"
            className="qc-mobile-search-btn"
            onClick={() => {
              setStartVoiceSearch(false);
              setSearchOpen(true);
            }}
            aria-label="Search formulations"
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#1E1638",
              cursor: "pointer",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </button>

          {/* Desktop Search Pill */}
          <div
            className="qc-desktop-search-pill"
            onClick={() => {
              setStartVoiceSearch(false);
              setSearchOpen(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#F1F5F9",
              border: "1px solid #E2E8F0",
              borderRadius: 999,
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: 12,
              color: "#64748B",
              minWidth: 190,
              maxWidth: 260,
              transition: "all 0.15s ease",
            }}
            role="button"
            tabIndex={0}
            aria-label="Search formulations"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setStartVoiceSearch(false);
                setSearchOpen(true);
              }
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Search formulations...
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setStartVoiceSearch(true);
                setSearchOpen(true);
              }}
              title="Voice Search"
              aria-label="Search with voice"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                color: "#7C3AED",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </button>
          </div>
          <SearchOverlay
            open={searchOpen}
            startVoiceOnOpen={startVoiceSearch}
            onClose={() => {
              setSearchOpen(false);
              setStartVoiceSearch(false);
            }}
          />
          <Link
            href="/account"
            className="icon-button"
            aria-label="View wishlist"
            title="Wishlist"
            style={{ fontSize: 20, border: 0, background: "transparent", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}
          >
            ♡{wish.length > 0 && <em style={{ position: "absolute", top: -4, right: -6, fontSize: 10, background: "#D4AF37", color: "#1E1638", borderRadius: 999, padding: "1px 5px", fontWeight: 700 }}>{wish.length}</em>}
          </Link>
          <Link
            href="/cart"
            style={{
              position: "relative",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
            aria-label={`Shopping Cart with ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            title="Cart"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E1638" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1"></circle>
              <circle cx="19" cy="21" r="1"></circle>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
            </svg>
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -6,
                background: "#1E1638",
                color: "#FFFFFF",
                fontSize: 10,
                fontWeight: 800,
                borderRadius: 999,
                minWidth: 16,
                height: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
              }}
            >
              {cartCount}
            </span>
          </Link>
          <Link
            href="/account"
            style={{
              fontSize: 18,
              color: "#1E1638",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
            }}
            aria-label={user ? "Account" : "Sign In"}
            title={user ? user.email : "Sign In"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E1638" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </Link>
          <button className="menu" onClick={() => setMenu(!menu)} aria-label="Toggle navigation">
            ☰
          </button>
        </div>
      </header>

      {/* Global Below Header Promotions Slot */}
      <UniversalPromoRenderer slot="global_below_header" />

      {/* Universal Marquee — Below Header Placement */}
      {isMarqueeActive && marqueePlacement === "below_header" && (
        <UniversalMarquee
          items={marqueeItems}
          speed={marqueeSpeed}
          separator={marqueeSeparator}
          currentPlacement="below_header"
          placement="below_header"
        />
      )}
    </>
  );
}
