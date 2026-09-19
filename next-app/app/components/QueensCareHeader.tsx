"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCartCount, subscribeCart } from "@/lib/client-cart";
import SearchOverlay from "./SearchOverlay";
import UniversalPromoRenderer from "./promotions/UniversalPromoRenderer";
import SocialMediaRenderer from "./social/SocialMediaRenderer";
import { useNavigation } from "./navigation/NavigationContext";

interface QueensCareHeaderProps {
  activePage?: "home" | "products" | "quiz" | "science" | "about" | "people" | "blog" | "careers";
  initialNav?: Array<{ id?: string; label: string; href: string }>;
}

export default function QueensCareHeader({ activePage = "home", initialNav }: QueensCareHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [startVoice, setStartVoice] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { navItems: contextNav } = useNavigation();
  const [logoUrl, setLogoUrl] = useState<string>("/images/brand/queens-care-horizontal-purple.png");
  const [logoHeight, setLogoHeight] = useState<string>("44px");
  const [logoMaxWidth, setLogoMaxWidth] = useState<string>("200px");

  useEffect(() => {
    setCartCount(getCartCount());
    const unsub = subscribeCart(() => {
      setCartCount(getCartCount());
    });

    // Fetch logo settings
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : { settings: [] }))
      .then((data) => {
        const settings = data.settings || [];
        settings.forEach((s: { key: string; value: string }) => {
          if (s.key === "logo_url" && s.value) setLogoUrl(s.value);
          if (s.key === "logo_height_desktop" && s.value) setLogoHeight(`${s.value}px`);
          if (s.key === "logo_max_width" && s.value) setLogoMaxWidth(`${s.value}px`);
        });
      })
      .catch(() => {});

    return () => unsub();
  }, []);

  // Authoritative live navigation only — zero hardcoded fallback that can flash hidden items
  const rawNav = (initialNav && initialNav.length > 0) ? initialNav : contextNav;
  const navItems = rawNav.map((item, idx) => ({
    id: item.id || `nav-${idx}`,
    label: item.label,
    href: item.href,
  }));

  return (
    <>
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          zIndex: 9999,
        }}
        onFocus={(e) => {
          (e.target as HTMLElement).style.cssText = 'position:fixed;top:0;left:0;right:0;padding:12px 24px;background:#2A0F3A;color:#fff;text-align:center;z-index:9999;font-size:14px;font-weight:600;width:auto;height:auto;overflow:visible;';
        }}
        onBlur={(e) => {
          (e.target as HTMLElement).style.cssText = 'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;';
        }}
      >
        Skip to main content
      </a>
      {/* Single Clean Authoritative Announcement Slot */}
      <UniversalPromoRenderer slot="global_announcement" />

      <header
        className="qc-global-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          height: "var(--qc-header-height, 72px)",
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid #EAE6DF",
          boxShadow: "0 2px 12px rgba(42, 15, 58, 0.04)",
          transition: "all 0.25s ease",
          display: "flex",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        <div
          className="qc-header-inner"
          style={{
            maxWidth: "1380px",
            width: "100%",
            margin: "0 auto",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            boxSizing: "border-box",
          }}
        >
          {/* Official Queens Care Laboratories Logo */}
          <Link
            href="/"
            aria-label="Queens Care Laboratories"
            style={{
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="Queens Care Laboratories"
              style={{
                height: logoHeight,
                width: "auto",
                maxWidth: logoMaxWidth,
                objectFit: "contain",
                display: "block",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/images/brand/queens-care-horizontal-purple.png";
              }}
            />
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              margin: "0 10px",
            }}
            className="qc-desktop-nav"
          >
            {navItems.map((item) => {
              const isActive = activePage === item.id || (item.href === "/" && activePage === "home");
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  style={{
                    fontSize: "13.5px",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#2A0F3A" : "#4B5563",
                    textDecoration: "none",
                    position: "relative",
                    padding: "6px 0",
                    transition: "color 0.2s ease",
                    letterSpacing: "-0.01em",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#2A0F3A";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#4B5563";
                  }}
                >
                  {item.label}
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        width: "100%",
                        height: "2.5px",
                        borderRadius: "2px",
                        background: "linear-gradient(90deg, #D4AF37 0%, #2A0F3A 100%)",
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexShrink: 0,
            }}
          >

            {/* Mobile Search Icon Button */}
            <button
              type="button"
              className="qc-mobile-search-btn"
              onClick={() => {
                setStartVoice(false);
                setSearchOpen(true);
              }}
              aria-label="Search formulations"
              style={{
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                color: "#2A0F3A",
                cursor: "pointer",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>

            {/* Desktop Pill Search Trigger */}
            <div
              className="qc-header-search qc-mobile-hide"
              onClick={() => {
                setStartVoice(false);
                setSearchOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: "50px",
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: "12.5px",
                color: "#6B7280",
                minWidth: "180px",
                maxWidth: "240px",
                transition: "all 0.2s ease",
              }}
              role="button"
              tabIndex={0}
              aria-label="Search formulations"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setStartVoice(false);
                  setSearchOpen(true);
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Search formulations...
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStartVoice(true);
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

            {/* Cart Icon with Live Badge */}
            <Link
              href="/cart"
              aria-label="View shopping cart"
              style={{
                position: "relative",
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2A0F3A",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F5F3FF";
                e.currentTarget.style.borderColor = "#DDD6FE";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#F9FAFB";
                e.currentTarget.style.borderColor = "#E5E7EB";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {cartCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    minWidth: "18px",
                    height: "18px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #D4AF37 0%, #B45309 100%)",
                    color: "#FFFFFF",
                    fontSize: "10px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    boxShadow: "0 2px 6px rgba(212, 175, 55, 0.4)",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account Icon */}
            <Link
              href="/account"
              aria-label="My Account"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2A0F3A",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F5F3FF";
                e.currentTarget.style.borderColor = "#DDD6FE";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#F9FAFB";
                e.currentTarget.style.borderColor = "#E5E7EB";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "8px",
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2A0F3A",
                cursor: "pointer",
              }}
              className="qc-mobile-toggle"
            >
              {mobileMenuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#FFFFFF",
              borderTop: "1px solid #EAE6DF",
              borderBottom: "1px solid #EAE6DF",
              padding: "16px 24px 24px",
              boxShadow: "0 14px 28px rgba(42, 15, 58, 0.1)",
              zIndex: 1000,
              maxHeight: "calc(100vh - 80px)",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {navItems.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      fontSize: "15px",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#2A0F3A" : "#4B5563",
                      textDecoration: "none",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: isActive ? "#F5F3FF" : "transparent",
                      display: "block",
                      minHeight: "44px",
                      boxSizing: "border-box",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div style={{ borderTop: "1px solid #EAE6DF", marginTop: "16px", paddingTop: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF", margin: "0 0 10px" }}>
                Connect with us
              </p>
              <SocialMediaRenderer placement="header" size={18} gap={12} variant="official" />
            </div>
          </div>
        )}
      </header>

      {/* Global Below Header Promotions Slot */}
      <UniversalPromoRenderer slot="global_below_header" />

      {/* Global Search Overlay */}
      <SearchOverlay
        open={searchOpen}
        startVoiceOnOpen={startVoice}
        onClose={() => {
          setSearchOpen(false);
          setStartVoice(false);
        }}
      />

      {/* Header Responsive Styles */}
      <style jsx global>{`
        @media (max-width: 1080px) {
          .qc-desktop-nav {
            display: none !important;
          }
          .qc-header-search {
            display: none !important;
          }
          .qc-mobile-search-btn {
            display: inline-flex !important;
          }
        }
        @media (min-width: 1081px) {
          .qc-mobile-toggle {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .qc-global-header {
            height: var(--qc-header-height-mobile, 64px) !important;
          }
          .qc-header-inner {
            padding: 0 16px !important;
            gap: 10px !important;
          }
        }
      `}</style>
    </>
  );
}
