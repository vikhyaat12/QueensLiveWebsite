"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SocialMediaRenderer from "./social/SocialMediaRenderer";
import { DEFAULT_FOOTER_CONFIG, FooterConfig } from "@/lib/commerce/footer-schema";
import { sanitizeHtml } from "@/lib/sanitize";

export type QueensCareFooterProps = {
  hideTrustStrip?: boolean;
  regulatory?: {
    drugLicenseNo?: string;
    fssaiNo?: string;
    gstin?: string;
    pharmacistInfo?: string;
    grievanceEmail?: string;
  };
};

export default function QueensCareFooter({
  hideTrustStrip = false,
  regulatory: initialRegulatory,
}: QueensCareFooterProps = {}) {
  const [config, setConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [openAccordion, setOpenAccordion] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);
  // Trust items become interactive only after the live CMS config resolves,
  // so an Admin-disabled link can never "flash" as clickable on first paint.
  const [liveConfigLoaded, setLiveConfigLoaded] = useState(false);

  // Detect mobile viewport for accordion behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch live footer configuration from CMS
  useEffect(() => {
    let cancelled = false;
    fetch("/api/footer")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success && data.config) {
          setConfig(data.config);
          setLiveConfigLoaded(true);
        } else if (!cancelled) {
          // API responded without a usable config — fall back to defaults
          // rather than leaving the trust strip permanently hidden.
          setLiveConfigLoaded(true);
        }
      })
      .catch((err) => {
        console.warn("[QueensCareFooter] Failed to fetch live config, using defaults:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleAccordion = (columnId: string) => {
    setOpenAccordion((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const {
    trustStrip = DEFAULT_FOOTER_CONFIG.trustStrip,
    brand = DEFAULT_FOOTER_CONFIG.brand,
    columns = DEFAULT_FOOTER_CONFIG.columns,
    contact = DEFAULT_FOOTER_CONFIG.contact,
    regulatory = DEFAULT_FOOTER_CONFIG.regulatory,
    clinicalNotice = DEFAULT_FOOTER_CONFIG.clinicalNotice,
    copyright = DEFAULT_FOOTER_CONFIG.copyright,
    styling = DEFAULT_FOOTER_CONFIG.styling,
  } = config;

  const isPlaceholder = (val?: string | null): boolean => {
    if (!val || typeof val !== "string") return true;
    const s = val.trim().toLowerCase();
    if (!s) return true;
    if (s.includes("27aaaaq1234f1z5") || s.includes("aaaaq1234") || s.includes("00aaaaa0000a0z0")) return true;
    if (s.includes("123 wellness avenue") || s.includes("central formulation hub") || s.includes("123 main st")) return true;
    if (s === "4050 8800" || s.includes("1800 123 4567") || s.includes("1234567890") || s.includes("9876543210")) return true;
    if (s === "test" || s === "demo" || s === "placeholder" || s === "sample" || s === "example" || s === "dummy") return true;
    return false;
  };

  const rawDrugLic = initialRegulatory?.drugLicenseNo || regulatory?.customDrugLicenseNo || "";
  const rawFssai = initialRegulatory?.fssaiNo || regulatory?.customFssaiNo || "";
  const rawGstin = initialRegulatory?.gstin || regulatory?.customGstin || "";
  const rawPharmacist = initialRegulatory?.pharmacistInfo || regulatory?.customPharmacistInfo || "";
  const rawGrievance = initialRegulatory?.grievanceEmail || regulatory?.customGrievanceEmail || "";
  const rawDispatch = regulatory?.dispatchProtocolText || "";

  // Effective regulatory values (allow prop override if explicitly passed)
  const effectiveRegulatory = {
    drugLicenseNo: !isPlaceholder(rawDrugLic) ? rawDrugLic : "",
    fssaiNo: !isPlaceholder(rawFssai) ? rawFssai : "",
    gstin: !isPlaceholder(rawGstin) ? rawGstin : "",
    pharmacistInfo: !isPlaceholder(rawPharmacist) ? rawPharmacist : "",
    grievanceEmail: !isPlaceholder(rawGrievance) ? rawGrievance : "",
    dispatchProtocol: !isPlaceholder(rawDispatch) ? rawDispatch : "",
  };

  const hasConfiguredRegulatory = Boolean(
    effectiveRegulatory.drugLicenseNo ||
    effectiveRegulatory.fssaiNo ||
    effectiveRegulatory.gstin ||
    effectiveRegulatory.pharmacistInfo
  );

  const visibleTrustItems = (trustStrip?.items || []).filter((item) => item.visible);
  const visibleColumns = (columns || []).filter((col) => col.visible).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const visibleCopyrightLinks = (copyright?.links || []).filter((link) => link.visible).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <footer
      style={{
        background: styling?.backgroundColor || "#150522",
        color: styling?.textColor || "#FAF8F5",
      }}
    >
      {/* ─── 1. TRUST BADGES STRIP ─── */}
      {!hideTrustStrip && trustStrip?.enabled && liveConfigLoaded && visibleTrustItems.length > 0 && (
        <div
          style={{
            background: styling?.trustBarBg || "linear-gradient(135deg, #1C0A2E 0%, #2A0F3A 50%, #180927 100%)",
            borderTop: `2px solid ${styling?.accentColor || "rgba(212, 175, 55, 0.35)"}`,
            borderBottom: `1px solid ${styling?.borderColor || "rgba(255, 255, 255, 0.08)"}`,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              maxWidth: "1340px",
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px 32px",
            }}
          >
            {visibleTrustItems.map((item) => {
              const isClickable = Boolean(item.linkUrl) && item.clickable !== false;
              const ItemInner = (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
                  <span style={{ fontSize: "24px", lineHeight: 1 }} aria-hidden="true">{item.icon}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>{item.title}</div>
                    <div style={{ fontSize: "11.5px", color: styling?.mutedTextColor || "rgba(255, 255, 255, 0.65)" }}>
                      {item.subtitle}
                    </div>
                  </div>
                </div>
              );

              return isClickable ? (
                <Link
                  key={item.id}
                  href={item.linkUrl as string}
                  aria-label={item.title}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {ItemInner}
                </Link>
              ) : (
                <div key={item.id} style={{ cursor: "default" }}>
                  {ItemInner}
                </div>
              );
            })}

            {trustStrip.tagline && (
              <div
                style={{
                  fontFamily: "var(--font-cursive, 'Brush Script MT', 'Caveat', cursive)",
                  fontSize: "21px",
                  color: "#FDE68A",
                  letterSpacing: "0.02em",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{trustStrip.tagline}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 2. MAIN FOOTER CONTENT ─── */}
      <div style={{ maxWidth: "1340px", margin: "0 auto", padding: "50px 24px 36px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "36px 32px",
            marginBottom: "44px",
          }}
        >
          {/* Brand Column */}
          <div style={{ gridColumn: "span 1" }}>
            <Link href="/" style={{ display: "inline-block", marginBottom: "16px" }} aria-label="Queens Care Home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand?.logoUrl || "/images/brand/queens-care-official-original.png"}
                alt={brand?.logoAlt || "Queens Care Laboratories"}
                style={{ height: `${brand?.logoHeight || 54}px`, maxWidth: "240px", objectFit: "contain" }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/images/brand/queens-care-gold-logo.png";
                }}
              />
            </Link>
            <p
              style={{
                fontSize: "13px",
                lineHeight: 1.65,
                color: styling?.mutedTextColor || "rgba(255, 255, 255, 0.7)",
                margin: "0 0 16px",
              }}
            >
              {brand?.aboutText}
            </p>
            {!isPlaceholder(brand?.certificationsText) && (
              <div style={{ fontSize: "12px", color: styling?.accentColor || "#D4AF37", fontWeight: 600 }}>
                {brand.certificationsText}
              </div>
            )}

            {brand?.showSocialMedia && (
              <div style={{ marginTop: "20px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: styling?.accentColor || "#D4AF37",
                    marginBottom: "10px",
                  }}
                >
                  {brand.socialTitle || "Official Social Channels"}
                </div>
                <SocialMediaRenderer
                  placement="footer"
                  variant="circular"
                  size={18}
                  gap={10}
                  color={styling?.accentColor || "#D4AF37"}
                  hoverColor="#FFFFFF"
                />
              </div>
            )}
          </div>

          {/* Dynamic Navigation Columns with Mobile Accordion */}
          {visibleColumns.map((col) => {
            const isAccordionOpen = !isMobile || Boolean(openAccordion[col.id]);
            const visibleLinks = (col.links || [])
              .filter((l) => l.visible)
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

            return (
              <div
                key={col.id}
                style={{
                  borderBottom: isMobile ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
                  paddingBottom: isMobile ? "14px" : "0",
                }}
              >
                {/* Column Title / Accordion Trigger */}
                {isMobile ? (
                  <button
                    type="button"
                    onClick={() => toggleAccordion(col.id)}
                    aria-expanded={isAccordionOpen}
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "transparent",
                      border: "none",
                      padding: "8px 0",
                      color: styling?.accentColor || "#D4AF37",
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span>{col.title}</span>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>
                      {isAccordionOpen ? "−" : "+"}
                    </span>
                  </button>
                ) : (
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: styling?.accentColor || "#D4AF37",
                      marginBottom: "16px",
                    }}
                  >
                    {col.title}
                  </div>
                )}

                {/* Column Links List */}
                {isAccordionOpen && (
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      fontSize: "13px",
                      marginTop: isMobile ? "8px" : "0",
                    }}
                  >
                    {visibleLinks.map((link) => (
                      <li key={link.id}>
                        <Link
                          href={link.href}
                          target={link.target || "_self"}
                          style={{
                            color: link.highlight ? "#FDE68A" : styling?.mutedTextColor || "rgba(255, 255, 255, 0.75)",
                            textDecoration: "none",
                            fontWeight: link.highlight ? 600 : 400,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: isMobile ? "6px 0" : "0",
                            transition: "color 0.2s ease",
                          }}
                        >
                          <span>{link.label}</span>
                          {link.badge && (
                            <span
                              style={{
                                fontSize: "9px",
                                background: "rgba(212, 175, 55, 0.2)",
                                color: "#FDE68A",
                                padding: "2px 6px",
                                borderRadius: "10px",
                                border: "1px solid rgba(212, 175, 55, 0.3)",
                              }}
                            >
                              {link.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          {/* Patient Support & Verification Column */}
          {contact?.enabled && contact?.visible && (() => {
            const hq = !isPlaceholder(contact?.headquartersText) ? contact.headquartersText : "";
            const helpline = !isPlaceholder(contact?.helplineText) ? contact.helplineText : "";
            const verification = !isPlaceholder(contact?.verificationText) ? contact.verificationText : "";
            const validBadges = (contact?.badges || []).filter((b) => b.visible && !isPlaceholder(b.label));
            if (!hq && !helpline && !verification && validBadges.length === 0) return null;
            return (
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: styling?.accentColor || "#D4AF37",
                    marginBottom: "16px",
                  }}
                >
                  {contact.title || "Patient Support & Verification"}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: styling?.mutedTextColor || "rgba(255, 255, 255, 0.75)",
                    lineHeight: 1.6,
                    marginBottom: "12px",
                  }}
                >
                  {hq && (
                    <div>
                      <strong>{contact.headquartersLabel || "Headquarters"}:</strong> {hq}
                    </div>
                  )}
                  {helpline && (
                    <div style={{ marginTop: "6px" }}>
                      <strong>{contact.helplineLabel || "Care Helpline"}:</strong> {helpline}
                    </div>
                  )}
                  {verification && (
                    <div>
                      <strong>{contact.verificationLabel || "Verification"}:</strong> {verification}
                    </div>
                  )}
                </div>

                {validBadges.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                    {validBadges.map((badge) => (
                      <span
                        key={badge.id}
                        style={{
                          fontSize: "11px",
                          background:
                            badge.styleVariant === "gold"
                              ? "rgba(212, 175, 55, 0.15)"
                              : "rgba(255, 255, 255, 0.1)",
                          color: badge.styleVariant === "gold" ? "#FDE68A" : "#FFFFFF",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          border:
                            badge.styleVariant === "gold"
                              ? "1px solid rgba(212, 175, 55, 0.3)"
                              : "1px solid rgba(255, 255, 255, 0.15)",
                        }}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ─── 2.5 STATUTORY & REGULATORY COMPLIANCE PANEL ─── */}
        {regulatory?.enabled && hasConfiguredRegulatory ? (
          <div
            style={{
              borderTop: `1px solid ${styling?.borderColor || "rgba(255, 255, 255, 0.08)"}`,
              marginBottom: "24px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px 24px",
              fontSize: "11px",
              lineHeight: 1.6,
              color: "rgba(255, 255, 255, 0.65)",
              background: "rgba(255, 255, 255, 0.02)",
              padding: "18px 20px",
              borderRadius: "8px",
              border: `1px solid ${styling?.accentColor ? "rgba(212, 175, 55, 0.15)" : "rgba(255, 255, 255, 0.08)"}`,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: styling?.accentColor || "#D4AF37", marginBottom: "4px" }}>
                {regulatory.titleStatutory || "STATUTORY REGISTRATIONS"}
              </div>
              {effectiveRegulatory.drugLicenseNo && (
                <div><strong>Drug Lic. No.:</strong> {effectiveRegulatory.drugLicenseNo}</div>
              )}
              {effectiveRegulatory.fssaiNo && (
                <div><strong>FSSAI Central Lic.:</strong> {effectiveRegulatory.fssaiNo}</div>
              )}
              {effectiveRegulatory.gstin && (
                <div><strong>GSTIN:</strong> {effectiveRegulatory.gstin}</div>
              )}
            </div>

            <div>
              <div style={{ fontWeight: 700, color: styling?.accentColor || "#D4AF37", marginBottom: "4px" }}>
                {regulatory.titlePharmacist || "PHARMACIST & GRIEVANCE DESK"}
              </div>
              {effectiveRegulatory.pharmacistInfo && (
                <div><strong>In-House Pharmacist:</strong> {effectiveRegulatory.pharmacistInfo}</div>
              )}
              {effectiveRegulatory.grievanceEmail && (
                <div><strong>Grievance Email:</strong> {effectiveRegulatory.grievanceEmail}</div>
              )}
              {effectiveRegulatory.dispatchProtocol && (
                <div><strong>Dispatch Quality:</strong> {effectiveRegulatory.dispatchProtocol}</div>
              )}
            </div>

            {clinicalNotice?.enabled && (
              <div style={{ gridColumn: "span 1" }}>
                <div style={{ fontWeight: 700, color: styling?.accentColor || "#D4AF37", marginBottom: "4px" }}>
                  {clinicalNotice.title || "CLINICAL NOTICE"}
                </div>
                <div
                  style={{ fontSize: "10.5px", color: "rgba(255, 255, 255, 0.5)" }}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(clinicalNotice.contentHtml || ""),
                  }}
                />
              </div>
            )}
          </div>
        ) : clinicalNotice?.enabled && clinicalNotice?.fallbackDisclaimer ? (
          <div
            style={{
              borderTop: `1px solid ${styling?.borderColor || "rgba(255, 255, 255, 0.08)"}`,
              paddingTop: "16px",
              marginBottom: "20px",
              fontSize: "11px",
              lineHeight: 1.6,
              color: "rgba(255, 255, 255, 0.5)",
              textAlign: "center",
            }}
          >
            {clinicalNotice.fallbackDisclaimer}
          </div>
        ) : null}

        {/* ─── 3. COPYRIGHT STRIP ─── */}
        <div
          style={{
            borderTop: `1px solid ${styling?.borderColor || "rgba(255, 255, 255, 0.08)"}`,
            paddingTop: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "12px",
            color: "rgba(255, 255, 255, 0.5)",
          }}
        >
          <div>
            {copyright?.template || `© ${new Date().getFullYear()} Queens Care Laboratories. All rights reserved.`}
          </div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {visibleCopyrightLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                target={link.target || "_self"}
                style={{ color: "rgba(255, 255, 255, 0.6)", textDecoration: "none" }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
