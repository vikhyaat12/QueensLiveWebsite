"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";
import type { OurPeoplePageConfig } from "@/lib/commerce/store-extensions";
import { sanitizeHtml } from "@/lib/sanitize";

export type EmployeeKeyStat = {
  number: string;
  label: string;
  subtitle?: string;
  icon?: string;
};

export type EmployeePrivacySettings = {
  showEmail?: boolean;
  showPhone?: boolean;
  showLocation?: boolean;
  showEmployeeId?: boolean;
  showSocialLinks?: boolean;
  showQR?: boolean;
  showStats?: boolean;
  showMedia?: boolean;
  showProducts?: boolean;
  showTeamMembers?: boolean;
  showDownloadPdf?: boolean;
};

export type EmployeeData = {
  id?: string;
  name: string;
  slug: string;
  employeeId?: string;
  designation?: string;
  heroSubtitle?: string;
  department?: string;
  photo?: string;
  profileImage?: string;
  phone?: string;
  email?: string;
  location?: string;
  bio?: string;
  active: boolean;
  verified?: boolean;
  quote?: string;
  eyebrow?: string;
  heroQuote?: string;
  signatureText?: string;
  heroPlaqueQuote?: string;
  heroPlaqueAuthor?: string;
  heroBadges?: Array<{ title: string; subtitle?: string; icon?: string }>;
  aboutIcon?: string;
  aboutTitle?: string;
  aboutSubtitle?: string;
  aboutParagraph1?: string;
  aboutParagraph2?: string;
  aboutCtaLabel?: string;
  aboutCtaUrl?: string;
  aboutQuoteText?: string;
  aboutQuoteAuthor?: string;
  keyStats?: EmployeeKeyStat[];
  journeyHtml?: string;
  visionHtml?: string;
  leadershipHtml?: string;
  initiativesHtml?: string;
  newsHtml?: string;
  heroBannerImage?: string;
  heroBannerPosition?: string;
  heroBannerOpacity?: number;
  heroBannerVisible?: boolean;
  gallery?: Array<string | { url: string; caption?: string }>;
  videos?: Array<{ id: string; url: string; title?: string; posterUrl?: string; duration?: string }>;
  featuredVideo?: { id: string; url: string; title?: string; subtitle?: string; posterUrl?: string; duration?: string };
  momentsGrid?: Array<{ title: string; imageUrl: string; tag?: string }>;
  featuredProductIds?: string[];
  sidebarPromo?: {
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaUrl?: string;
    bgImage?: string;
  };
  footerBadges?: Array<{ label: string; subtitle?: string; icon?: string }>;
  footerTagline?: string;
  privacySettings?: EmployeePrivacySettings;
  photoSettings?: {
    desktopSize?: number;
    mobileSize?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    objectFit?: "cover" | "contain";
    shadow?: boolean;
    zoom?: number;
    positionX?: number;
    positionY?: number;
    rotation?: number;
  };
  themeColors?: Record<string, string>;
  socialLinks?: Record<string, { url: string; enabled: boolean }>;
};

export interface FeaturedProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  badgeColor?: string;
  category?: string;
  image?: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  shortDescription?: string;
}

interface EmployeeProfileClientProps {
  employee: EmployeeData;
  allEmployees?: EmployeeData[];
  featuredProducts?: FeaturedProductItem[];
  pageConfig?: OurPeoplePageConfig;
}

const QC_DEFAULTS = {
  primary: "#1E0C38",
  deepNavy: "#12051E",
  gold: "#D4AF37",
  lightGold: "#F3E3B6",
  amberGold: "#E0A838",
  background: "#F7F5F0",
  cardBg: "#FFFFFF",
  text: "#1F2937",
  muted: "#6B7280",
  border: "#E8E4DF",
};

export default function EmployeeProfileClient({
  employee,
  allEmployees = [],
  featuredProducts = [],
  pageConfig,
}: EmployeeProfileClientProps) {
  const pd = pageConfig?.profileDefaults || {};
  const theme = pageConfig?.theme || {};

  const [activeTab, setActiveTab] = useState("overview");
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeVideoModal, setActiveVideoModal] = useState<{ url: string; title: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(3);

  const ps = employee.privacySettings || {};
  const showEmail = ps.showEmail !== false;
  const showPhone = ps.showPhone !== false;
  const showLocation = ps.showLocation !== false;
  const showEmployeeId = ps.showEmployeeId !== false;
  const showSocialLinks = ps.showSocialLinks !== false;
  const showQR = ps.showQR !== false;
  const showStats = ps.showStats !== false;
  const showMedia = ps.showMedia !== false;
  const showProducts = ps.showProducts !== false;
  const showTeamMembers = ps.showTeamMembers !== false;
  const showDownloadPdf = ps.showDownloadPdf !== false;

  const isActive = employee.active !== false;
  const isVerified = employee.verified !== false;

  // Portrait photo
  const photo = employee.photo || employee.profileImage || "/uploads/employees/chatgpt-image-sep-7-2026-12_18_49-am-1788722742789.png";

  // Dynamic Badges in Hero matching reference
  const heroBadges = employee.heroBadges && employee.heroBadges.length > 0
    ? employee.heroBadges
    : [
        { icon: "🏆", title: "30+ Years", subtitle: "Years of Industry Experience" },
        { icon: "👥", title: "People First", subtitle: "People First Leadership" },
        { icon: "💡", title: "Innovation", subtitle: "Innovation Driven" },
        { icon: "🛡️", title: "Millions", subtitle: "Trusted by Millions" },
      ];

  // Dynamic 4 Key Stats matching reference
  const statsList: EmployeeKeyStat[] = employee.keyStats && employee.keyStats.length > 0
    ? employee.keyStats
    : [
        { number: "30+", label: "Years of Experience", subtitle: "In Pharmaceutical Industry", icon: "🏆" },
        { number: "500+", label: "Products Launched", subtitle: "Across Therapeutic Categories", icon: "🧪" },
        { number: "100+", label: "Team Members", subtitle: "Driven by a Shared Purpose", icon: "👥" },
        { number: "Millions", label: "Lives Touched", subtitle: "Through Trusted Solutions", icon: "🌐" },
      ];

  // Key Moments & Media
  const featuredVideo = employee.featuredVideo || {
    id: "vid-sanjay-summit",
    title: "Our Journey",
    subtitle: "A Healthier Tomorrow",
    duration: "03:24",
    posterUrl: "/images/hero/sanjay-hero-reference-crop.jpg",
    url: "",
  };

  const momentsGrid = employee.momentsGrid && employee.momentsGrid.length > 0
    ? employee.momentsGrid
    : [
        { title: "Product Innovation", imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80" },
        { title: "Research & Development", imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80" },
        { title: "Team & Culture", imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80" },
        { title: "Global Impact", imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80" },
      ];

  // Footer transition badges
  const footerBadges = employee.footerBadges && employee.footerBadges.length > 0
    ? employee.footerBadges
    : [
        { label: "Quality You Can Trust", subtitle: "In Every Product", icon: "🛡️" },
        { label: "Science-Backed", subtitle: "Formulations", icon: "⚛️" },
        { label: "People-Driven", subtitle: "Growth", icon: "👥" },
        { label: "A Healthier Tomorrow", subtitle: "For Everyone", icon: "❤️" },
      ];

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://queenscare.in";
  const profileUrl = `${currentOrigin}/employee/${employee.slug}`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleAddToCart = (productName: string) => {
    setCartCount((prev) => prev + 1);
    showToast(`✓ Added "${productName}" to your bag`);
  };

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement> | null, id: string) => {
    if (e) e.preventDefault();
    setActiveTab(id);
    const elem = document.getElementById(id);
    if (elem) {
      const top = elem.getBoundingClientRect().top + window.pageYOffset - 120;
      window.scrollTo({ top, behavior: "smooth" });
      if (typeof window !== "undefined" && window.history?.pushState) {
        window.history.pushState(null, "", `#${id}`);
      }
    }
  };

  useEffect(() => {
    const sectionIds = [
      "overview",
      "journey",
      "vision",
      "leadership",
      ...(showMedia ? ["media"] : []),
      ...(showProducts ? ["products"] : []),
      "initiatives",
      "news",
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-120px 0px -60% 0px",
        threshold: 0,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [showMedia, showProducts]);

  // Team members list for sidebar (ensuring at least 6 members from db or reference defaults)
  const defaultTeamMembers = [
    { name: "Dr. Vikram Singhania", designation: "Principal Formulation Scientist", slug: "vikram-singhania", photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80" },
    { name: "Dr. Ananya Mehta", designation: "Chief Research Scientist", slug: "dr-ananya-mehta", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80" },
    { name: "Rajesh Kumar", designation: "Head of Quality Assurance", slug: "rajesh-kumar", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" },
    { name: "Priya Sharma", designation: "Head of Regulatory Affairs", slug: "priya-sharma", photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80" },
    { name: "Arjun Iyer", designation: "Head of Supply Chain", slug: "arjun-iyer", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80" },
    { name: "Meera Joshi", designation: "Head of Human Resources", slug: "meera-joshi", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80" },
  ];

  const displayTeam = allEmployees.filter((m) => m.slug !== employee.slug);
  const finalTeam = displayTeam.length >= 4 ? displayTeam.slice(0, 6) : defaultTeamMembers;

  return (
    <div
      style={{
        background: theme.primaryBg || QC_DEFAULTS.background,
        minHeight: "100vh",
        color: theme.textColor || QC_DEFAULTS.text,
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
    >
      <style>{`
        .qc-hover-gold:hover {
          color: #D4AF37 !important;
        }
        .qc-pill-active {
          background: #1E0C38 !important;
          color: #FFFFFF !important;
        }
        .qc-pill-inactive:hover {
          background: rgba(30, 12, 56, 0.08) !important;
          color: #1E0C38 !important;
        }
        .qc-product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08) !important;
        }
        @media (max-width: 1024px) {
          .qc-main-grid {
            grid-template-columns: 1fr !important;
          }
          .qc-hero-container {
            flex-direction: column !important;
            text-align: center !important;
          }
          .qc-hero-right-plaque {
            margin: 20px auto 0 !important;
            max-width: 100% !important;
          }
          .qc-about-subcolumns {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .qc-products-row {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .qc-moments-wrapper {
            grid-template-columns: 1fr !important;
          }
          .qc-footer-strip-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 520px) {
          .qc-products-row {
            grid-template-columns: 1fr !important;
          }
          .qc-footer-strip-grid {
            grid-template-columns: 1fr !important;
          }
          .qc-stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* 1. OFFICIAL QUEENS CARE HEADER */}
      <QueensCareHeader activePage="people" />

      {/* 2. CINEMATIC EXECUTIVE HERO (REFERENCE EXACT MATCH) */}
      <section
        style={{
          position: "relative",
          minHeight: 520,
          background: "linear-gradient(135deg, #100318 0%, #1A0726 40%, #0E0316 100%)",
          color: "#FFFFFF",
          overflow: "hidden",
          borderBottom: "2px solid #D4AF37",
        }}
      >
        {/* Layer 1: Executive Office Backdrop (Admin-Editable & Configurable) */}
        {employee.heroBannerVisible !== false && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url('${employee.heroBannerImage || "/images/hero/executive-library-bg.jpg"}')`,
              backgroundSize: "cover",
              backgroundPosition: employee.heroBannerPosition || "center 30%",
              opacity: typeof employee.heroBannerOpacity === "number" ? employee.heroBannerOpacity : 0.38,
              mixBlendMode: "luminosity",
            }}
            aria-hidden="true"
          />
        )}

        {/* Layer 2: Deep Luxury Purple & Vignette Radial Lighting */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(circle at 75% 35%, rgba(212, 175, 55, 0.18) 0%, transparent 55%), linear-gradient(90deg, rgba(14,3,20,0.92) 0%, rgba(26,7,38,0.78) 50%, rgba(14,3,20,0.88) 100%)",
          }}
          aria-hidden="true"
        />

        {/* Hero Foreground Content */}
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: "50px 24px 36px",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            className="qc-hero-container"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 32,
              flexWrap: "wrap",
            }}
          >
            {/* Left: Sanjay Portrait at Desk + Executive Desk Accessories */}
            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "clamp(240px, 25vw, 310px)",
                  height: "clamp(290px, 30vw, 380px)",
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "2px solid rgba(212, 175, 55, 0.6)",
                  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(212, 175, 55, 0.25)",
                  background: "linear-gradient(180deg, #1C082A 0%, #100418 100%)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={employee.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                    display: "block",
                  }}
                />

                {/* Overlaid Official Lapel Badge in Corner */}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "rgba(16, 185, 129, 0.95)",
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                    border: "1px solid #FFFFFF",
                  }}
                >
                  ✓ Verified
                </div>
              </div>

              {/* Desk Bookshelf Plaque Accent ("VISION", "INNOVATION", "QUALITY", "PEOPLE FIRST") */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginTop: -14,
                  position: "relative",
                  zIndex: 3,
                }}
              >
                {["VISION", "INNOVATION", "QUALITY", "PEOPLE FIRST"].map((val, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "rgba(24, 7, 36, 0.92)",
                      border: "1px solid #D4AF37",
                      color: "#E8C88A",
                      fontSize: 8,
                      fontWeight: 800,
                      padding: "3px 6px",
                      borderRadius: 4,
                      letterSpacing: "0.08em",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
                    }}
                  >
                    {val}
                  </span>
                ))}
              </div>
            </div>

            {/* Center / Left Title & Quotes */}
            <div style={{ flex: 1, minWidth: 320, maxWidth: 600 }}>
              {/* Eyebrow */}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: "#E8C88A",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                {employee.eyebrow || "FOUNDER & CHAIRMAN"}
              </div>

              {/* Name */}
              <h1
                style={{
                  fontFamily: "Georgia, 'Playfair Display', serif",
                  fontSize: "clamp(34px, 4.2vw, 52px)",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  margin: "0 0 6px 0",
                  color: "#FFFFFF",
                  letterSpacing: "-0.01em",
                }}
              >
                {employee.name}
              </h1>

              {/* Subtitle */}
              <div
                style={{
                  fontSize: "clamp(16px, 2vw, 21px)",
                  color: "#D4AF37",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  marginBottom: 18,
                }}
              >
                {employee.heroSubtitle || employee.designation || "Founder, Chairman & Visionary Leader"}
              </div>

              {/* Cursive Flowing Quote */}
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, 'Brush Script MT', cursive",
                  fontStyle: "italic",
                  fontSize: "clamp(20px, 2.4vw, 26px)",
                  lineHeight: 1.35,
                  color: "#F3E3B6",
                  textShadow: "0 2px 10px rgba(212, 175, 55, 0.3)",
                  marginBottom: 4,
                }}
              >
                &ldquo;{employee.heroQuote || employee.quote || "Building Better Health For Every Tomorrow"}&rdquo;
              </div>

              {/* Script Signature */}
              <div
                style={{
                  fontFamily: "'Brush Script MT', 'Caveat', cursive",
                  fontSize: "clamp(24px, 3vw, 32px)",
                  color: "#E8C88A",
                  marginBottom: 24,
                  transform: "rotate(-2deg)",
                  display: "inline-block",
                }}
              >
                {employee.signatureText || employee.name}
              </div>
            </div>

            {/* Right: Stacked Glowing Crest on top + Floating Frosted Quote Plaque below */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                maxWidth: 320,
                width: "100%",
                flexShrink: 0,
              }}
            >
              {/* Glowing Queens Care Emblem */}
              <div
                style={{
                  textAlign: "center",
                  filter: "drop-shadow(0 0 35px rgba(212, 175, 55, 0.45))",
                  width: "100%",
                  pointerEvents: "none",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/hero/sanjay-hero-glowing-crest.png"
                  alt="Queens Care Emblem"
                  style={{ width: "clamp(180px, 20vw, 240px)", height: "auto", display: "inline-block" }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/images/brand/queens-care-official-original.png";
                  }}
                />
                <div
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    color: "#E2C684",
                    textTransform: "uppercase",
                    marginTop: 6,
                    opacity: 0.9,
                  }}
                >
                  SCIENCE TODAY • A HEALTHIER TOMORROW
                </div>
              </div>

              {/* Floating Frosted Glass Plaque Quote */}
              <div
                className="qc-hero-right-plaque"
                style={{
                  background: "rgba(24, 7, 36, 0.72)",
                  border: "1px solid rgba(212, 175, 55, 0.4)",
                  borderRadius: 12,
                  padding: "18px 22px",
                  width: "100%",
                  boxSizing: "border-box",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 12px 35px rgba(0, 0, 0, 0.4)",
                }}
              >
                <div
                  style={{
                    fontFamily: "Georgia, serif",
                    fontStyle: "italic",
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#EADDC7",
                    marginBottom: 8,
                  }}
                >
                  &ldquo;{employee.heroPlaqueQuote || "Good health is not a privilege, it's a responsibility we all share."}&rdquo;
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#D4AF37",
                    textAlign: "right",
                    letterSpacing: "0.04em",
                  }}
                >
                  {employee.heroPlaqueAuthor || `— ${employee.name}`}
                </div>
              </div>
            </div>
          </div>

          {/* 4 Hero Badges Across Bottom of Hero */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
              marginTop: 36,
            }}
          >
            {heroBadges.map((badge, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(24, 7, 36, 0.65)",
                  border: "1px solid rgba(212, 175, 55, 0.3)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  backdropFilter: "blur(6px)",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
                }}
              >
                <span style={{ fontSize: 20 }}>{badge.icon || "🏆"}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>{badge.title}</div>
                  <div style={{ fontSize: 11, color: "#D1C7DC" }}>{badge.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CAPSULE STICKY SUBNAV BAR */}
      <nav
        style={{
          position: "sticky",
          top: 66,
          zIndex: 80,
          background: "#FFFFFF",
          borderBottom: "1px solid #E8E4DF",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
          padding: "10px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            overflowX: "auto",
          }}
        >
          {/* Capsule Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {[
              { id: "overview", label: "Overview" },
              { id: "journey", label: "Journey" },
              { id: "vision", label: "Vision & Mission" },
              { id: "leadership", label: "Leadership" },
              ...(showMedia ? [{ id: "media", label: "Gallery & Media" }] : []),
              ...(showProducts ? [{ id: "products", label: "Products" }] : []),
              { id: "initiatives", label: "Key Initiatives" },
              { id: "news", label: "News & Insights" },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <a
                  key={tab.id}
                  href={`#${tab.id}`}
                  onClick={(e) => handleScrollTo(e, tab.id)}
                  className={isSelected ? "qc-pill-active" : "qc-pill-inactive"}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                    color: isSelected ? "#FFFFFF" : "#4B5563",
                    background: isSelected ? QC_DEFAULTS.primary : "transparent",
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </a>
              );
            })}
          </div>

          {/* Connect With Sanjay Button */}
          <div style={{ flexShrink: 0 }}>
            {showEmail && employee.email ? (
              <a
                href={`mailto:${employee.email}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 20px",
                  background: QC_DEFAULTS.primary,
                  color: "#FFFFFF",
                  borderRadius: 22,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(30, 12, 56, 0.25)",
                  transition: "transform 0.15s ease",
                }}
              >
                <span>✉</span> Connect with {employee.name.split(" ")[0]}
              </a>
            ) : (
              <a
                href="#credentials"
                onClick={(e) => handleScrollTo(e, "credentials")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 20px",
                  background: QC_DEFAULTS.primary,
                  color: "#FFFFFF",
                  borderRadius: 22,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(30, 12, 56, 0.25)",
                  transition: "transform 0.15s ease",
                  cursor: "pointer",
                }}
              >
                <span>🪪</span> Official Credentials
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* 4. MAIN 2-COLUMN EDITORIAL CONTENT (LEFT 68%, RIGHT 32%) */}
      <main style={{ maxWidth: 1320, margin: "36px auto 0", padding: "0 24px" }}>
        <div
          className="qc-main-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 32,
            alignItems: "start",
          }}
        >
          {/* =========================================
              LEFT COLUMN (68%): EDITORIAL & RICH CARDS
             ========================================= */}
          <div style={{ display: "grid", gap: 32 }}>
            {/* CARD 1: ABOUT MR. SANJAY WALIA */}
            <div
              id="overview"
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: "32px 36px",
                border: "1px solid #E8E4DF",
                boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)",
                scrollMarginTop: 130,
              }}
            >
              {/* Header with user icon */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "rgba(30, 12, 56, 0.07)",
                    color: QC_DEFAULTS.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  {employee.aboutIcon || "👤"}
                </div>
                <h2
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 24,
                    color: QC_DEFAULTS.primary,
                    margin: 0,
                    fontWeight: 700,
                  }}
                >
                  {employee.aboutTitle || `About Mr. ${employee.name}`}
                </h2>
              </div>

              {/* Subtitle */}
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1E0C38",
                  marginBottom: 24,
                  paddingLeft: 50,
                }}
              >
                {employee.aboutSubtitle || "A Purpose-Driven Leader in Pharmaceutical Wellness"}
              </div>

              {/* Split Subcolumns: Left paragraphs, Right cursive quote box */}
              <div
                className="qc-about-subcolumns"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 0.8fr",
                  gap: 28,
                  alignItems: "stretch",
                }}
              >
                {/* Left narrative */}
                <div>
                  <div
                    style={{
                      borderLeft: "3px solid #D4AF37",
                      paddingLeft: 16,
                      fontSize: 14,
                      lineHeight: 1.75,
                      color: "#374151",
                      marginBottom: 16,
                    }}
                  >
                    {employee.aboutParagraph1 ||
                      `Mr. ${employee.name} is the Founder and Chairman of Queens Care Laboratories. With over 30 years of experience in the pharmaceutical industry, he has built the company on the pillars of quality, integrity, innovation and a genuine commitment to people's health.`}
                  </div>

                  <p style={{ fontSize: 14, lineHeight: 1.75, color: "#4B5563", margin: "0 0 24px 0" }}>
                    {employee.aboutParagraph2 ||
                      "Under his leadership, Queens Care has grown into a trusted name, delivering science-backed wellness solutions that touch millions of lives. His focus remains on creating a healthier, happier future through better products, stronger teams and a positive impact on society."}
                  </p>

                  <a
                    href={employee.aboutCtaUrl || "#journey"}
                    onClick={(e) => handleScrollTo(e, "journey")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 24px",
                      background: "linear-gradient(135deg, #E0A838 0%, #D4AF37 100%)",
                      color: "#1E0C38",
                      fontWeight: 700,
                      fontSize: 13,
                      borderRadius: 24,
                      textDecoration: "none",
                      boxShadow: "0 4px 14px rgba(212, 175, 55, 0.3)",
                      transition: "transform 0.15s ease",
                      cursor: "pointer",
                    }}
                  >
                    {employee.aboutCtaLabel || "Read Full Story →"}
                  </a>
                </div>

                {/* Right cursive quote card with leaf icon */}
                <div
                  style={{
                    background: "rgba(254, 249, 240, 0.7)",
                    borderRadius: 14,
                    padding: "24px 20px",
                    border: "1px solid rgba(212, 175, 55, 0.25)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 12, color: "#D4AF37" }}>🌿</div>
                  <div
                    style={{
                      fontFamily: "Georgia, serif",
                      fontStyle: "italic",
                      fontSize: 15,
                      lineHeight: 1.65,
                      color: "#1E0C38",
                      marginBottom: 12,
                    }}
                  >
                    &ldquo;{employee.aboutQuoteText || "A healthier world is possible when science, people and purpose work together."}&rdquo;
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#C19A6B",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {employee.aboutQuoteAuthor || `— ${employee.name}`}
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: 4 HORIZONTAL KEY STATS (Respects showStats) */}
            {showStats && (
              <div
                id="stats"
                className="qc-stats-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 16,
                }}
              >
                {statsList.map((st, idx) => {
                  const circleColors = ["#3B82F6", "#8B5CF6", "#6366F1", "#4F46E5"];
                  return (
                    <div
                      key={idx}
                      style={{
                        background: "#FFFFFF",
                        borderRadius: 12,
                        padding: "18px 16px",
                        border: "1px solid #E8E4DF",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: `${circleColors[idx % 4]}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        {st.icon || "🏆"}
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: "Georgia, serif",
                            fontSize: 22,
                            fontWeight: 700,
                            color: QC_DEFAULTS.primary,
                            lineHeight: 1.1,
                          }}
                        >
                          {st.number}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#1F2937" }}>
                          {st.label}
                        </div>
                        {st.subtitle && (
                          <div style={{ fontSize: 10, color: "#6B7280" }}>{st.subtitle}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CARD: EXECUTIVE JOURNEY & MILESTONES */}
            <div
              id="journey"
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: "30px 32px",
                border: "1px solid #E8E4DF",
                boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)",
                scrollMarginTop: 130,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(30, 12, 56, 0.07)",
                    color: QC_DEFAULTS.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  🏛️
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: 22,
                      color: QC_DEFAULTS.primary,
                      margin: 0,
                      fontWeight: 700,
                    }}
                  >
                    Executive Journey & Milestones
                  </h2>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                    30+ Years of Pioneering Pharmaceutical Science & Global Healthcare Leadership
                  </div>
                </div>
              </div>

              {employee.journeyHtml ? (
                <div
                  className="qc-editorial-prose"
                  style={{ fontSize: 14, lineHeight: 1.8, color: "#374151" }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(employee.journeyHtml) }}
                />
              ) : (
                <div style={{ display: "grid", gap: 18, marginTop: 10 }}>
                  {[
                    {
                      year: "1994",
                      title: "Formulation Chemistry & Pharmaceutical Roots",
                      desc: "Initiated clinical research career focusing on standardized botanical extracts and pharmaceutical-grade bio-availability protocols across India.",
                    },
                    {
                      year: "2004",
                      title: "Standardized Botanical Quality Protocols",
                      desc: "Pioneered multi-spectrum HPLC analytical finger-printing for herbal actives, ensuring batch-to-batch chemical reproducibility and zero adulteration.",
                    },
                    {
                      year: "2014",
                      title: "Founding Queens Care Laboratories",
                      desc: "Established state-of-the-art cGMP manufacturing facilities in India, unifying classical natural wellness with rigorous modern pharmacological science.",
                    },
                    {
                      year: "2024–Present",
                      title: "National Reach & Healthcare Accreditations",
                      desc: "Leading national wellness expansion, clinical validation trials, doctor advisory networks, and impacting over 500,000 families annually.",
                    },
                  ].map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        gap: 16,
                        alignItems: "flex-start",
                        position: "relative",
                        paddingBottom: idx === 3 ? 0 : 12,
                        borderBottom: idx === 3 ? "none" : "1px solid #F3F4F6",
                      }}
                    >
                      <div
                        style={{
                          background: "linear-gradient(135deg, #1E0C38 0%, #3B165C 100%)",
                          color: "#D4AF37",
                          fontFamily: "Georgia, serif",
                          fontSize: 13,
                          fontWeight: 700,
                          padding: "6px 12px",
                          borderRadius: 8,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          border: "1px solid rgba(212, 175, 55, 0.4)",
                        }}
                      >
                        {m.year}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: QC_DEFAULTS.primary, marginBottom: 4 }}>
                          {m.title}
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.65, color: "#4B5563" }}>
                          {m.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CARD: VISION & MISSION */}
            <div
              id="vision"
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: "30px 32px",
                border: "1px solid #E8E4DF",
                boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)",
                scrollMarginTop: 130,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(30, 12, 56, 0.07)",
                    color: QC_DEFAULTS.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  🌟
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: 22,
                      color: QC_DEFAULTS.primary,
                      margin: 0,
                      fontWeight: 700,
                    }}
                  >
                    Vision & Mission
                  </h2>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                    Empowering Millions with Pure, Science-Backed Wellness
                  </div>
                </div>
              </div>

              {employee.visionHtml ? (
                <div
                  className="qc-editorial-prose"
                  style={{ fontSize: 14, lineHeight: 1.8, color: "#374151" }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(employee.visionHtml) }}
                />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 18,
                    marginTop: 8,
                  }}
                  className="qc-vision-grid"
                >
                  <div
                    style={{
                      background: "linear-gradient(135deg, rgba(254, 249, 240, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%)",
                      borderRadius: 12,
                      padding: "22px 20px",
                      border: "1px solid rgba(212, 175, 55, 0.35)",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#C19A6B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      Our Vision
                    </div>
                    <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, color: QC_DEFAULTS.primary, margin: "0 0 10px 0" }}>
                      Setting India&apos;s Benchmark in Preventative Wellness
                    </h3>
                    <p style={{ fontSize: 13, lineHeight: 1.65, color: "#4B5563", margin: 0 }}>
                      To stand as India&apos;s premier standard of excellence in therapeutic preventative healthcare — where botanical wisdom harmonizes seamlessly with rigorous clinical pharmacology, ensuring every family has verified, pure nutrition.
                    </p>
                  </div>

                  <div
                    style={{
                      background: "linear-gradient(135deg, rgba(245, 243, 255, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%)",
                      borderRadius: 12,
                      padding: "22px 20px",
                      border: "1px solid rgba(42, 15, 58, 0.2)",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: QC_DEFAULTS.primary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      Our Mission
                    </div>
                    <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, color: QC_DEFAULTS.primary, margin: "0 0 10px 0" }}>
                      Zero Compromise in Everyday Clinical Health
                    </h3>
                    <p style={{ fontSize: 13, lineHeight: 1.65, color: "#4B5563", margin: 0 }}>
                      To eliminate compromise in therapeutic nutrition. We formulate with zero synthetic fillers, enforce multi-stage HPLC testing for every batch, and deliver honest, accessible health solutions that genuinely transform lives.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* CARD: LEADERSHIP PHILOSOPHY */}
            <div
              id="leadership"
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: "30px 32px",
                border: "1px solid #E8E4DF",
                boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)",
                scrollMarginTop: 130,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(30, 12, 56, 0.07)",
                    color: QC_DEFAULTS.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  🛡️
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: 22,
                      color: QC_DEFAULTS.primary,
                      margin: 0,
                      fontWeight: 700,
                    }}
                  >
                    Leadership Philosophy
                  </h2>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                    People-First Stewardship, Scientific Rigor & Uncompromising Integrity
                  </div>
                </div>
              </div>

              {employee.leadershipHtml ? (
                <div
                  className="qc-editorial-prose"
                  style={{ fontSize: 14, lineHeight: 1.8, color: "#374151" }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(employee.leadershipHtml) }}
                />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 16,
                    marginTop: 8,
                  }}
                  className="qc-leadership-grid"
                >
                  {[
                    {
                      icon: "🔬",
                      title: "Scientific Rigor",
                      desc: "Every formulation is validated with strict HPLC and heavy metal testing. Scientific integrity is never negotiated for profit margins.",
                    },
                    {
                      icon: "👥",
                      title: "People-First Stewardship",
                      desc: "True leadership is demonstrated by elevating people — from clinical researchers and laboratory chemists to the patients relying on our care.",
                    },
                    {
                      icon: "🌿",
                      title: "Uncompromising Purity",
                      desc: "Direct farm-to-capsule traceability with 100% natural bio-actives, zero artificial preservatives, and sustainable eco-friendly practices.",
                    },
                  ].map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#FAF8F5",
                        borderRadius: 12,
                        padding: "20px 18px",
                        border: "1px solid #E8E4DF",
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</div>
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: QC_DEFAULTS.primary, marginBottom: 6 }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: 12, lineHeight: 1.6, color: "#4B5563" }}>
                        {p.desc}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CARD 3: KEY MOMENTS & MEDIA (Respects showMedia) */}
            {showMedia && (
              <div
                id="media"
                style={{
                  background: "#FFFFFF",
                  borderRadius: 16,
                  padding: "30px 32px",
                  border: "1px solid #E8E4DF",
                  boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)",
                  scrollMarginTop: 130,
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(30, 12, 56, 0.07)",
                        color: QC_DEFAULTS.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                      }}
                    >
                      📷
                    </div>
                    <h2
                      style={{
                        fontFamily: "Georgia, serif",
                        fontSize: 22,
                        color: QC_DEFAULTS.primary,
                        margin: 0,
                        fontWeight: 700,
                      }}
                    >
                      {pd.mediaSectionTitle || "Key Moments & Media"}
                    </h2>
                  </div>

                  <a
                    href="#gallery"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: QC_DEFAULTS.primary,
                      textDecoration: "none",
                    }}
                  >
                    View All →
                  </a>
                </div>

                {/* 16:9 Featured Keynote Video + 2x2 Grid */}
                <div
                  className="qc-moments-wrapper"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr",
                    gap: 18,
                  }}
                >
                  {/* Left: 16:9 Featured Keynote */}
                  <div
                    onClick={() => setActiveVideoModal({ url: featuredVideo.url, title: featuredVideo.title || "Annual Keynote" })}
                    style={{
                      position: "relative",
                      borderRadius: 12,
                      overflow: "hidden",
                      aspectRatio: "16/10",
                      cursor: "pointer",
                      background: "#1E0C38",
                      boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featuredVideo.posterUrl || "/images/hero/sanjay-hero-reference-crop.jpg"}
                      alt={featuredVideo.title || "Keynote"}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(18,5,28,0.85) 100%)",
                      }}
                    />

                    {/* Centered Purple Play Button */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        background: "rgba(30, 12, 56, 0.9)",
                        border: "2px solid #D4AF37",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FFFFFF",
                        fontSize: 20,
                        boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                      }}
                    >
                      ▶
                    </div>

                    {/* Bottom Title & Duration Badge */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 14,
                        left: 16,
                        right: 16,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 11, color: "#D4AF37", fontWeight: 700, textTransform: "uppercase" }}>
                          {featuredVideo.subtitle || "Our Journey"}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", fontFamily: "Georgia, serif" }}>
                          {featuredVideo.title || "A Healthier Tomorrow"}
                        </div>
                      </div>
                      <div
                        style={{
                          background: "rgba(0,0,0,0.75)",
                          color: "#FFFFFF",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 4,
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        {featuredVideo.duration || "03:24"}
                      </div>
                    </div>
                  </div>

                  {/* Right: 2x2 Grid of Moments */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    {momentsGrid.slice(0, 4).map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          borderRadius: 10,
                          overflow: "hidden",
                          aspectRatio: "1/1",
                          cursor: "pointer",
                          background: "#1E0C38",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.imageUrl}
                          alt={m.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(18,5,28,0.9) 100%)",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            bottom: 8,
                            left: 10,
                            right: 10,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#FFFFFF",
                            lineHeight: 1.2,
                          }}
                        >
                          {m.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CARD 4: FEATURED PRODUCTS (4 IN A ROW) (Respects showProducts) */}
            {showProducts && (
              <div
                id="products"
                style={{
                  background: "#FFFFFF",
                  borderRadius: 16,
                  padding: "30px 32px",
                  border: "1px solid #E8E4DF",
                  boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)",
                  scrollMarginTop: 130,
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(30, 12, 56, 0.07)",
                        color: QC_DEFAULTS.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                      }}
                    >
                      🏆
                    </div>
                    <h2
                      style={{
                        fontFamily: "Georgia, serif",
                        fontSize: 22,
                        color: QC_DEFAULTS.primary,
                        margin: 0,
                        fontWeight: 700,
                      }}
                    >
                      {pd.productsSectionTitle || "Featured Products (Inspired by Our Leadership)"}
                    </h2>
                  </div>

                  <Link
                    href="/shop"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: QC_DEFAULTS.primary,
                      textDecoration: "none",
                    }}
                  >
                    View All →
                  </Link>
                </div>

                {/* 4 Products in a Row */}
                <div
                  className="qc-products-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 16,
                  }}
                >
                  {featuredProducts.slice(0, 4).map((p, idx) => {
                    const discount = p.originalPrice && p.originalPrice > p.price
                      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                      : 25;

                    const badgeLabels = ["Bestseller", "New", "Popular", "Expert Pick"];
                    const badgeColors = ["#E0A838", "#10B981", "#F97316", "#3B82F6"];
                    const badgeText = p.badge || badgeLabels[idx % 4];
                    const badgeColor = badgeColors[idx % 4];

                    return (
                      <div
                        key={p.id || idx}
                        className="qc-product-card"
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #EAE6DF",
                          borderRadius: 12,
                          padding: 14,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          transition: "all 0.2s ease",
                          position: "relative",
                        }}
                      >
                        {/* Category Pill Tag */}
                        <div
                          style={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            background: badgeColor,
                            color: "#FFFFFF",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 10,
                            zIndex: 2,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                          }}
                        >
                          {badgeText}
                        </div>

                        {/* Product Bottle Image */}
                        <div
                          style={{
                            width: "100%",
                            aspectRatio: "1/1",
                            background: "#FAF8F5",
                            borderRadius: 8,
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 12,
                            padding: 8,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.image || "/images/hero/immune-support-bottle-clean.png"}
                            alt={p.name}
                            style={{ width: "90%", height: "90%", objectFit: "contain" }}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/images/hero/immune-support-bottle-clean.png";
                            }}
                          />
                        </div>

                        {/* Product Info */}
                        <div>
                          <div style={{ fontSize: 10, color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>
                            Queens Care
                          </div>
                          <Link
                            href={`/products/${p.slug}`}
                            style={{
                              textDecoration: "none",
                              color: QC_DEFAULTS.primary,
                              fontFamily: "Georgia, serif",
                              fontSize: 14,
                              fontWeight: 700,
                              lineHeight: 1.3,
                              display: "block",
                              marginTop: 2,
                              marginBottom: 4,
                            }}
                          >
                            {p.name}
                          </Link>
                          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {p.shortDescription || "Clinical Formulations"}
                          </div>

                          {/* Star Rating */}
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10, fontSize: 11 }}>
                            <span style={{ color: "#F59E0B" }}>★ {p.rating || 4.8}</span>
                            <span style={{ color: "#9CA3AF" }}>({p.reviewCount || "1.2K"})</span>
                          </div>
                        </div>

                        {/* Pricing & Add to Cart Button */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderTop: "1px solid #F3F4F6",
                            paddingTop: 8,
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                              <span style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: QC_DEFAULTS.primary }}>
                                ₹{p.price}
                              </span>
                              {p.originalPrice && (
                                <span style={{ fontSize: 11, color: "#9CA3AF", textDecoration: "line-through" }}>
                                  ₹{p.originalPrice}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444" }}>
                              {discount}% OFF
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(p.name)}
                            aria-label={`Add ${p.name} to cart`}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              background: "rgba(30, 12, 56, 0.08)",
                              border: "1px solid rgba(30, 12, 56, 0.2)",
                              color: QC_DEFAULTS.primary,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 16,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            🛒
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CARD: KEY INITIATIVES */}
            <div
              id="initiatives"
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: "30px 32px",
                border: "1px solid #E8E4DF",
                boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)",
                scrollMarginTop: 130,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(30, 12, 56, 0.07)",
                    color: QC_DEFAULTS.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  🚀
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: 22,
                      color: QC_DEFAULTS.primary,
                      margin: 0,
                      fontWeight: 700,
                    }}
                  >
                    Key Initiatives
                  </h2>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                    Transformative Programs Spearheaded by Queens Care Leadership
                  </div>
                </div>
              </div>

              {employee.initiativesHtml ? (
                <div
                  className="qc-editorial-prose"
                  style={{ fontSize: 14, lineHeight: 1.8, color: "#374151" }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(employee.initiativesHtml) }}
                />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 16,
                    marginTop: 8,
                  }}
                  className="qc-initiatives-grid"
                >
                  {[
                    {
                      tag: "Sourcing Excellence",
                      title: "The Pure Botanical Standard",
                      desc: "Direct contractual partnerships with over 40 certified organic farms across the Himalayan foothills and Western Ghats, securing chemical purity at the root.",
                    },
                    {
                      tag: "Community Health",
                      title: "Preventative Outreach Camps",
                      desc: "Conducting over 100 free diagnostic health camps annually across rural and peri-urban districts, delivering early detection screenings to underserved families.",
                    },
                    {
                      tag: "Sustainability",
                      title: "Zero-Waste Green Laboratories",
                      desc: "Transitioning manufacturing to zero-solvent botanical extractions, closed-loop water filtration, and 100% recyclable amber glass packaging.",
                    },
                  ].map((init, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#FAF8F5",
                        borderRadius: 12,
                        padding: "20px 18px",
                        border: "1px solid #E8E4DF",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            display: "inline-block",
                            background: "rgba(212, 175, 55, 0.15)",
                            color: "#996515",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            marginBottom: 10,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {init.tag}
                        </span>
                        <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: QC_DEFAULTS.primary, marginBottom: 8 }}>
                          {init.title}
                        </div>
                        <div style={{ fontSize: 12, lineHeight: 1.6, color: "#4B5563" }}>
                          {init.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CARD: NEWS & INSIGHTS */}
            <div
              id="news"
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: "30px 32px",
                border: "1px solid #E8E4DF",
                boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)",
                scrollMarginTop: 130,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(30, 12, 56, 0.07)",
                    color: QC_DEFAULTS.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  📰
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: 22,
                      color: QC_DEFAULTS.primary,
                      margin: 0,
                      fontWeight: 700,
                    }}
                  >
                    News & Insights
                  </h2>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                    Latest Perspectives, Clinical Research & Corporate Milestones
                  </div>
                </div>
              </div>

              {employee.newsHtml ? (
                <div
                  className="qc-editorial-prose"
                  style={{ fontSize: 14, lineHeight: 1.8, color: "#374151" }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(employee.newsHtml) }}
                />
              ) : (
                <div style={{ display: "grid", gap: 14, marginTop: 8 }}>
                  {[
                    {
                      date: "September 2026",
                      category: "Press Release",
                      title: "Queens Care Laboratories Expands Direct Doctor Advisory Council to 80+ Integrative Medicine Specialists",
                      snippet: "Strategic expansion accelerates the clinical vetting of next-generation bioactive wellness formulations nationwide.",
                    },
                    {
                      date: "August 2026",
                      category: "Clinical Bulletin",
                      title: "Comparative Pharmacokinetic Trial Confirms 2.4x Higher Absorption for Queens Care Liposomal Formulations",
                      snippet: "Independent third-party laboratory data confirms breakthrough bioavailability metrics across oral therapeutic delivery systems.",
                    },
                    {
                      date: "July 2026",
                      category: "Leadership Keynote",
                      title: "Mr. Sanjay Walia Addresses Global Health Conclave on Standards of Purity in Botanical Healthcare",
                      snippet: "Delivered keynote address calling for standardized HPLC testing mandates across the Asian pharmaceutical nutraceutical sector.",
                    },
                  ].map((news, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "16px 18px",
                        background: "#FAF8F5",
                        borderRadius: 10,
                        border: "1px solid #E8E4DF",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11 }}>
                        <span style={{ color: "#996515", fontWeight: 700, textTransform: "uppercase" }}>{news.category}</span>
                        <span style={{ color: "#9CA3AF" }}>•</span>
                        <span style={{ color: "#6B7280" }}>{news.date}</span>
                      </div>
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: QC_DEFAULTS.primary }}>
                        {news.title}
                      </div>
                      <div style={{ fontSize: 12, lineHeight: 1.5, color: "#4B5563" }}>
                        {news.snippet}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* =========================================
              RIGHT COLUMN (32%): SIDEBAR
             ========================================= */}
          <aside style={{ display: "grid", gap: 24 }}>
            {/* SIDEBAR CARD 1: EMPLOYMENT VERIFICATION */}
            <div
              id="credentials"
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: "24px 22px",
                border: "1px solid #E8E4DF",
                boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🪪</span>
                  <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, color: QC_DEFAULTS.primary, margin: 0, fontWeight: 700 }}>
                    {pd.verificationSectionTitle || "Employment Verification"}
                  </h3>
                </div>
                <span
                  style={{
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#059669",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 12,
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  ✓ Active & Verified
                </span>
              </div>

              {/* Key-Value Details */}
              <div style={{ display: "grid", gap: 10, fontSize: 12, marginBottom: 20 }}>
                {showEmployeeId && (
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", paddingBottom: 6 }}>
                    <span style={{ color: "#6B7280" }}>Official ID</span>
                    <span style={{ fontWeight: 700, color: QC_DEFAULTS.primary }}>{employee.employeeId || "1122"}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", paddingBottom: 6 }}>
                  <span style={{ color: "#6B7280" }}>Designation</span>
                  <span style={{ fontWeight: 600, color: QC_DEFAULTS.primary }}>{employee.designation || "Founder & Chairman"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", paddingBottom: 6 }}>
                  <span style={{ color: "#6B7280" }}>Department</span>
                  <span style={{ fontWeight: 600, color: QC_DEFAULTS.primary }}>{employee.department || "Executive Leadership"}</span>
                </div>
                {showEmail && employee.email && (
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", paddingBottom: 6 }}>
                    <span style={{ color: "#6B7280" }}>Email</span>
                    <a href={`mailto:${employee.email}`} style={{ color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>
                      {employee.email}
                    </a>
                  </div>
                )}
                {showPhone && employee.phone && (
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", paddingBottom: 6 }}>
                    <span style={{ color: "#6B7280" }}>Phone</span>
                    <span style={{ fontWeight: 600, color: QC_DEFAULTS.primary }}>{employee.phone}</span>
                  </div>
                )}
                {showLocation && (
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", paddingBottom: 6 }}>
                    <span style={{ color: "#6B7280" }}>Location</span>
                    <span style={{ fontWeight: 600, color: QC_DEFAULTS.primary }}>{employee.location || "Head Office, India"}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 6 }}>
                  <span style={{ color: "#6B7280" }}>Status</span>
                  <span style={{ fontWeight: 700, color: "#059669" }}>✓ Active & Verified</span>
                </div>
              </div>

              {/* QR Code Container with Center Queens Care Emblem */}
              {showQR && (
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div
                    style={{
                      display: "inline-block",
                      padding: 10,
                      background: "#FFFFFF",
                      borderRadius: 12,
                      border: "1.5px solid #D4AF37",
                      boxShadow: "0 4px 16px rgba(212, 175, 55, 0.15)",
                    }}
                  >
                    <QRCodeSVG
                      value={profileUrl}
                      size={140}
                      level="H"
                      imageSettings={{
                        src: "/images/brand/queens-care-crest-96.png",
                        x: undefined,
                        y: undefined,
                        height: 28,
                        width: 28,
                        excavate: true,
                      }}
                      fgColor="#1E0C38"
                    />
                  </div>
                  <div style={{ fontSize: 10, color: "#6B7280", marginTop: 8, lineHeight: 1.4 }}>
                    Scan the QR code to verify this employee profile on the official Queens Care Laboratories website.
                  </div>
                </div>
              )}

            </div>

            {/* SIDEBAR CARD 2: ALL TEAM MEMBERS */}
            {showTeamMembers && (
              <div
                id="team"
                style={{
                  background: "#FFFFFF",
                  borderRadius: 16,
                  padding: "24px 22px",
                  border: "1px solid #E8E4DF",
                  boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>👥</span>
                    <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, color: QC_DEFAULTS.primary, margin: 0, fontWeight: 700 }}>
                      {pd.teamSectionTitle || "All Team Members"}
                    </h3>
                  </div>

                  <Link
                    href="/employee"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: QC_DEFAULTS.primary,
                      textDecoration: "none",
                    }}
                  >
                    View All →
                  </Link>
                </div>

                {/* 6 Team Members */}
                <div style={{ display: "grid", gap: 8 }}>
                  {finalTeam.map((m, idx) => (
                    <Link
                      key={m.slug || idx}
                      href={`/employee/${m.slug}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        borderRadius: 8,
                        textDecoration: "none",
                        color: "inherit",
                        border: "1px solid transparent",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={(m as any).photo || (m as any).profileImage || "/uploads/employees/chatgpt-image-sep-7-2026-12_18_49-am-1788722742789.png"}
                        alt={m.name}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1px solid #D4AF37",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: QC_DEFAULTS.primary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {m.name}
                        </div>
                        <div style={{ fontSize: 10, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {m.designation || "Executive Team"}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: "#9CA3AF" }}>›</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* SIDEBAR CARD 3: BOTTOM PROMO CARD */}
            <div
              style={{
                position: "relative",
                borderRadius: 16,
                overflow: "hidden",
                padding: "24px 20px",
                color: "#FFFFFF",
                boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                border: "1px solid rgba(212, 175, 55, 0.35)",
                background: "linear-gradient(135deg, #1C0A28 0%, #12041A 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ flex: 1, zIndex: 2 }}>
                <h4
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 17,
                    fontWeight: 700,
                    margin: "0 0 6px 0",
                    color: "#FFFFFF",
                    lineHeight: 1.3,
                  }}
                >
                  {employee.sidebarPromo?.title || "Strong People Build a Healthier Tomorrow"}
                </h4>

                <p style={{ fontSize: 11, color: "#D1C7DC", margin: "0 0 14px 0", lineHeight: 1.4 }}>
                  {employee.sidebarPromo?.subtitle || "Meet our dedicated executive and research team"}
                </p>

                <Link
                  href={employee.sidebarPromo?.ctaUrl || "/employee"}
                  style={{
                    display: "inline-block",
                    padding: "8px 18px",
                    background: "linear-gradient(135deg, #E0A838 0%, #D4AF37 100%)",
                    color: "#1E0C38",
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 20,
                    textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(212, 175, 55, 0.35)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  {employee.sidebarPromo?.ctaText || "Meet Our Team →"}
                </Link>
              </div>

              {/* Clean botanical wellness bottles and plant asset */}
              <div
                style={{
                  width: 104,
                  height: 104,
                  flexShrink: 0,
                  borderRadius: 10,
                  overflow: "hidden",
                  zIndex: 2,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/hero/sanjay-promo-card-botanical.png"
                  alt="Queens Care Wellness"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* 5. FOOTER TRANSITION STRIP (4 CIRCULAR GOLD BADGES + CURSIVE TAGLINE) */}
      <section
        style={{
          marginTop: 60,
          background: "#150522",
          borderTop: "1px solid rgba(212, 175, 55, 0.3)",
          borderBottom: "1px solid rgba(212, 175, 55, 0.3)",
          padding: "24px 24px",
          color: "#FFFFFF",
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          {/* 4 Gold Circular Badges */}
          <div
            className="qc-footer-strip-grid"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            {footerBadges.map((b, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    border: "1.5px solid #D4AF37",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    color: "#D4AF37",
                    background: "rgba(212, 175, 55, 0.08)",
                  }}
                >
                  {b.icon || "🛡️"}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>{b.label}</div>
                  <div style={{ fontSize: 10, color: "#D1C7DC" }}>{b.subtitle}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Cursive Calligraphy Tagline */}
          <div
            style={{
              fontFamily: "'Brush Script MT', 'Playfair Display', cursive",
              fontSize: "clamp(20px, 2.2vw, 26px)",
              color: "#E8C88A",
              fontStyle: "italic",
              letterSpacing: "0.02em",
            }}
          >
            {employee.footerTagline || "Together for a healthier tomorrow ♡"}
          </div>
        </div>
      </section>

      {/* 6. OFFICIAL QUEENS CARE GLOBAL FOOTER */}
      <QueensCareFooter hideTrustStrip />

      {/* 7. MODALS & NOTIFICATIONS */}
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#1E0C38",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            border: "1px solid #D4AF37",
            zIndex: 9999,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Video Modal */}
      {activeVideoModal && (
        <div
          onClick={() => setActiveVideoModal(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 800,
              background: "#1E0C38",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid #D4AF37",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(212,175,55,0.3)",
              }}
            >
              <h4 style={{ margin: 0, color: "#FFFFFF", fontFamily: "Georgia, serif" }}>
                {activeVideoModal.title}
              </h4>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ aspectRatio: "16/9", background: "#000000" }}>
              <iframe
                src={activeVideoModal.url.replace("watch?v=", "embed/")}
                title={activeVideoModal.title}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
