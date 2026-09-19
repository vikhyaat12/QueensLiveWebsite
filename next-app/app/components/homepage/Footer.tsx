"use client";

import Link from "next/link";
import SocialMediaRenderer from "../social/SocialMediaRenderer";
import type { HomeShared } from "./shared";

type HomeFooterProps = {
  shared: HomeShared;
  isEmployeeVisibleInFooter: boolean;
};

export default function HomeFooter({ shared, isEmployeeVisibleInFooter }: HomeFooterProps) {
  const {
    logoUrl, logoFailed, logoHeight, logoMaxWidth, logoRetryCount, setLogoRetryCount, setLogoFailed,
    footerSettings, footerLinks, socialLinks, subscribe,
  } = shared;
  return (
    <>
      <footer
        style={{
          ...(footerSettings.bg ? { backgroundColor: footerSettings.bg } : {}),
          ...(footerSettings.textColor ? { color: footerSettings.textColor } : {}),
        }}
      >
        <div className="footer-top">
          <Link href="/" className="brand inverse" aria-label="Queens Care Laboratories home" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            {logoUrl && !logoFailed ? (
              <img
                src={logoUrl.includes("purple") ? "/uploads/logos/queens-care-horizontal-white.png" : logoUrl}
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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src="/images/brand/queens-care-gold-logo.png"
                  alt="Queens Care Laboratories"
                  style={{ height: 44, width: "auto", objectFit: "contain" }}
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                />
                <span>QUEENS<br/><b>CARE</b></span>
              </div>
            )}
          </Link>
          {footerSettings.tagline ? (
            <p style={{ whiteSpace: "pre-line" }}>{footerSettings.tagline}</p>
          ) : (
            <p>Care is a practice.<br/>Make it <em>yours.</em></p>
          )}
          <form onSubmit={subscribe}>
            <label htmlFor="footer-email">{footerSettings.newsletterTitle || "A considered note, once in a while."}</label>
            <div>
              <input id="footer-email" type="email" required placeholder="Email address"/>
              <button aria-label="Subscribe">→</button>
            </div>
          </form>
        </div>
      <div className="footer-links">
        {(footerLinks.length > 0 ? footerLinks : [
          { section: "Shop", links: [
            { label: "All care", href: "/#collection", visible: true, sort: 0 },
            { label: "Best sellers", href: "/shop", visible: true, sort: 1 },
            { label: "Store locator", href: "/store-locator", visible: true, sort: 2 },
            { label: "B2B portal", href: "/b2b", visible: true, sort: 3 }
          ]},
          { section: "About", links: [
            { label: "Our story", href: "/about", visible: true, sort: 4 },
            { label: "Journal", href: "/blog", visible: true, sort: 5 },
            ...(isEmployeeVisibleInFooter ? [{ label: "Our team", href: "/employee", visible: true, sort: 6 }] : []),
            { label: "Careers", href: "/careers", visible: true, sort: 7 },
            { label: "Contact", href: "/contact", visible: true, sort: 8 }
          ]},
          { section: "Support", links: [
            { label: "Trust Center", href: "/trust", visible: true, sort: 8.5 },
            { label: "Quality Assurance", href: "/quality-assurance", visible: true, sort: 8.6 },
            { label: "Manufacturing", href: "/manufacturing", visible: true, sort: 8.7 },
            { label: "FAQ", href: "/faq", visible: true, sort: 9 },
            { label: "Track order", href: "/track-order", visible: true, sort: 10 },
            { label: "Privacy", href: "/privacy", visible: true, sort: 11 },
            { label: "Terms", href: "/terms", visible: true, sort: 12 }
          ]},
          { section: "Partnerships", links: [
            { label: "Doctor portal", href: "/doctors", visible: true, sort: 13 },
            { label: "Distributor portal", href: "/b2b", visible: true, sort: 14 },
            { label: "Become an Affiliate", href: "/affiliate", visible: true, sort: 15 }
          ]}
        ]).map((section) => {
          const visibleLinks = section.links.filter(l => l.visible !== false).sort((a,b) => (a.sort ?? 0) - (b.sort ?? 0));
          if (visibleLinks.length === 0) return null;
          return (
            <div key={section.section}>
              <b>{section.section}</b>
              {visibleLinks.map((link) => {
                if (link.href.startsWith("#")) return <a key={link.label} href={link.href}>{link.label}</a>;
                return <Link key={link.label} href={link.href}>{link.label}</Link>;
              })}
            </div>
          );
        })}
      </div>
      <div style={{ maxWidth: 1200, margin: "24px auto 0", padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 11, lineHeight: 1.6, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
        <b>STATUTORY HEALTHCARE &amp; FORMULATION DISCLAIMER:</b> The statements and formulations presented on queenscare.in are intended solely for general wellness, educational, and cosmetic hygiene purposes. None of the products or information provided herein are intended to diagnose, treat, cure, or prevent any medical condition or acute pathology. Queens Care formulations are dietary supplements and topical dermatological preparations, not scheduled prescription drugs. Always consult a qualified, licensed medical practitioner or dermatologist before beginning any new supplementation or skincare protocol, especially if pregnant, nursing, or undergoing clinical treatment.
      </div>

      {/* Dynamic Social Links via centralized SocialMediaRenderer */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 20px", display: "flex", justifyContent: "center" }}>
        <SocialMediaRenderer
          placement="footer"
          variant="circular"
          size={20}
          gap={14}
          color="#D4AF37"
          hoverColor="#FFFFFF"
          align="center"
        />
      </div>

      <div className="footer-bottom">
        <span>© 2026 Queens Care Laboratories. All rights reserved.</span>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="/privacy" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Privacy Policy</a>
          <a href="/terms" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Terms & Conditions</a>
        </div>
        <span>Queens Care Laboratories · India</span>
      </div>
      </footer>
    </>
  );
}
