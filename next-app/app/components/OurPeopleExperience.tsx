"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { OurPeoplePageConfig } from "@/lib/commerce/store-extensions";
import QueensCareHeader from "./QueensCareHeader";
import QueensCareFooter from "./QueensCareFooter";

export interface OurPeopleMember {
  id: string;
  name: string;
  slug?: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  location?: string;
  bio?: string;
  quote?: string;
  photo?: string;
  profileImage?: string;
  verified?: boolean;
  featured?: boolean;
  active?: boolean;
  sortOrder?: number;
  socialLinks?: {
    linkedin?: { enabled?: boolean; url?: string };
    email?: { enabled?: boolean; url?: string };
    twitter?: { enabled?: boolean; url?: string };
  };
  departmentIcon?: string;
  photoSettings?: {
    desktopSize?: number;
    mobileSize?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    objectFit?: "cover" | "contain";
    shadow?: boolean;
  };
}

export interface OurPeopleExperienceProps {
  initialConfig: OurPeoplePageConfig;
  initialEmployees: OurPeopleMember[];
}

function EmployeeAvatar({ emp, size = "card" }: { emp: OurPeopleMember; size?: "card" | "list" }) {
  const [failed, setFailed] = useState(false);
  const photo = emp.profileImage || emp.photo;
  const initials = (emp.name || "QC")
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (!photo || failed) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at center, #2D1B4E 0%, #150824 100%)",
          color: "#E8C88A",
          position: size === "card" ? "absolute" : "relative",
          top: 0,
          left: 0,
          borderRadius: size === "list" ? "10px" : undefined,
          overflow: "hidden",
          border: "1px solid rgba(212, 175, 55, 0.25)",
        }}
      >
        <span
          style={{
            fontSize: size === "list" ? 20 : 34,
            fontFamily: "var(--font-display, serif)",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#D4AF37",
          }}
        >
          {initials}
        </span>
        {size === "card" && (
          <span
            style={{
              fontSize: 10,
              color: "rgba(232, 200, 138, 0.75)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginTop: 4,
              fontWeight: 600,
            }}
          >
            {emp.department || "Queens Care"}
          </span>
        )}
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={photo}
      alt={emp.name}
      onError={() => setFailed(true)}
      style={{
        position: size === "card" ? "absolute" : "relative",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transition: "transform 0.4s ease",
      }}
      onMouseEnter={(e) => {
        if (size === "card") e.currentTarget.style.transform = "scale(1.04)";
      }}
      onMouseLeave={(e) => {
        if (size === "card") e.currentTarget.style.transform = "none";
      }}
    />
  );
}

export default function OurPeopleExperience({
  initialConfig,
  initialEmployees,
}: OurPeopleExperienceProps) {
  const config = initialConfig;
  const employees = initialEmployees;

  // Filter & Layout States
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Video Lightbox Modal State
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Dr Queens Blinking animation state
  const [isBlinking, setIsBlinking] = useState(false);

  // Category Carousel scroll ref
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Eye blinking loop
  useEffect(() => {
    if (config.animations?.masterEnabled === false || config.animations?.drQueensBlink === false || !config.hero.character?.blinkImageUrl) return;
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 180);
    }, 4000);
    return () => clearInterval(interval);
  }, [config.hero.character?.blinkImageUrl, config.animations?.drQueensBlink, config.animations?.masterEnabled]);

  // Handle ESC key to close video modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsVideoModalOpen(false);
    };
    if (isVideoModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isVideoModalOpen]);

  // Calculate dynamic department counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: employees.length };
    employees.forEach((emp) => {
      const dept = emp.department || "Other";
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return counts;
  }, [employees]);

  // Filtered & Sorted employees list
  const filteredEmployees = useMemo(() => {
    const filtered = employees.filter((emp) => {
      if (emp.active === false) return false;

      // Category chip filter
      if (selectedCategory !== "all") {
        const chip = config.categoryChips.find((c) => c.id === selectedCategory);
        if (chip && chip.departmentKey !== "all") {
          const empDept = (emp.department || "").toLowerCase();
          const targetDept = chip.departmentKey.toLowerCase();
          if (!empDept.includes(targetDept) && !targetDept.includes(empDept)) {
            return false;
          }
        }
      }

      // Department dropdown filter
      if (selectedDepartment !== "all" && selectedDepartment !== "All Departments") {
        const empDept = (emp.department || "").toLowerCase();
        const targetDept = selectedDepartment.toLowerCase();
        if (!empDept.includes(targetDept) && !targetDept.includes(empDept)) {
          return false;
        }
      }

      // Location filter
      if (selectedLocation !== "all" && selectedLocation !== "All Locations") {
        const empLoc = (emp.location || "").toLowerCase();
        const targetLoc = selectedLocation.toLowerCase();
        if (!empLoc.includes(targetLoc)) {
          return false;
        }
      }

      // Free text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (emp.name || "").toLowerCase();
        const des = (emp.designation || "").toLowerCase();
        const dep = (emp.department || "").toLowerCase();
        const loc = (emp.location || "").toLowerCase();
        const bio = (emp.bio || "").toLowerCase();
        const quote = (emp.quote || "").toLowerCase();
        const id = (emp.employeeId || "").toLowerCase();

        const matches =
          name.includes(q) ||
          des.includes(q) ||
          dep.includes(q) ||
          loc.includes(q) ||
          bio.includes(q) ||
          quote.includes(q) ||
          id.includes(q);

        if (!matches) return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (selectedSort === "featured") {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (a.sortOrder || 99) - (b.sortOrder || 99);
      }
      if (selectedSort === "name_asc") {
        return a.name.localeCompare(b.name);
      }
      if (selectedSort === "name_desc") {
        return b.name.localeCompare(a.name);
      }
      if (selectedSort === "dept") {
        return (a.department || "").localeCompare(b.department || "");
      }
      return 0;
    });

    return filtered;
  }, [
    employees,
    selectedCategory,
    selectedDepartment,
    selectedLocation,
    selectedSort,
    searchQuery,
    config.categoryChips,
  ]);

  // Pagination
  const pageSize = config.directoryGrid.cardsPerPage || 24;
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedDepartment, selectedLocation, selectedSort, searchQuery]);

  const scrollCategories = (dir: "left" | "right") => {
    if (categoryScrollRef.current) {
      const offset = dir === "left" ? -280 : 280;
      categoryScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const getEmbedUrl = (url?: string) => {
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) {
      return url.replace("watch?v=", "embed/") + "?autoplay=1";
    }
    if (url.includes("youtu.be/")) {
      return url.replace("youtu.be/", "www.youtube.com/embed/") + "?autoplay=1";
    }
    return url;
  };

  // ─── DYNAMIC SECTION ORDERING & SAFE HERO CLEARANCE ───
  const defaultSectionsList: Array<{ id: string; visible: boolean; order: number }> = [
    { id: "hero", visible: true, order: 0 },
    { id: "filterBar", visible: true, order: 1 },
    { id: "categoryChips", visible: true, order: 2 },
    { id: "directoryGrid", visible: true, order: 3 },
    { id: "cultureSection", visible: true, order: 4 },
    { id: "lifeSection", visible: true, order: 5 },
    { id: "ctaSection", visible: true, order: 6 },
    { id: "trustBadgesBar", visible: true, order: 7 },
  ];

  const orderedSections = useMemo(() => {
    const raw = (Array.isArray(config.sections) && config.sections.length > 0)
      ? config.sections
      : defaultSectionsList;
    return [...raw]
      .filter((s) => s && s.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [config.sections]);

  const isPrecededByHero = useMemo(() => {
    const heroIdx = orderedSections.findIndex((s) => s.id === "hero");
    const filterIdx = orderedSections.findIndex((s) => s.id === "filterBar");
    return heroIdx !== -1 && filterIdx > heroIdx && config.hero?.enabled !== false;
  }, [orderedSections, config.hero?.enabled]);

  // ─── DYNAMIC SECTION RENDERERS ───
  const renderHeroSection = () => {
    if (config.hero?.enabled === false) return null;
    return (
      <section
        style={{
          position: "relative",
          background: config.hero?.styles?.background || config.theme?.heroBgGradient || "linear-gradient(135deg, #180927 0%, #2A0F3A 45%, #150522 100%)",
          color: "#ffffff",
          paddingTop: "clamp(48px, 6vw, 70px)",
          paddingBottom: "clamp(56px, 8vw, 80px)",
          overflow: "hidden",
        }}
      >
        {/* Ambient Radial Lighting */}
        <div
          style={{
            position: "absolute",
            top: "-15%",
            left: "15%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212, 175, 55, 0.14) 0%, rgba(42, 15, 58, 0) 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            right: "10%",
            width: "550px",
            height: "550px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(147, 51, 234, 0.22) 0%, rgba(42, 15, 58, 0) 70%)",
            filter: "blur(70px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: "1340px",
            margin: "0 auto",
            padding: "0 24px",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* 3-Part Hero Grid: Left Content, Center Character Stage, Right Plaque & Video */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr",
              gap: "36px",
              alignItems: "center",
              marginBottom: "40px",
            }}
            className="qc-hero-three-col"
          >
            {/* LEFT: Typography & Headline & CTAs */}
            <div>
              <div style={{ marginBottom: "14px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 16px",
                    borderRadius: "50px",
                    background: "rgba(232, 200, 138, 0.12)",
                    border: "1px solid rgba(232, 200, 138, 0.35)",
                    color: "#E8C88A",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  <span>✦</span>
                  <span>{config.hero.eyebrow || "QUEENS CARE LABORATORIES"}</span>
                  <span>✦</span>
                </span>
              </div>

              <h1
                style={{
                  margin: "0 0 16px",
                  fontSize: "clamp(34px, 4.8vw, 54px)",
                  fontWeight: 800,
                  lineHeight: 1.12,
                  letterSpacing: "-0.02em",
                  fontFamily: "var(--font-display, 'Playfair Display', Georgia, serif)",
                }}
              >
                <span>{config.hero.heading}{" "}</span>
                <br />
                <span
                  style={{
                    background: `linear-gradient(135deg, #FDE68A 0%, ${config.theme?.goldAccent || "#D4AF37"} 50%, #F59E0B 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: `0 0 30px ${config.theme?.goldAccent || "rgba(212, 175, 55, 0.3)"}`,
                  }}
                >
                  {config.hero.highlightedHeading}
                </span>
              </h1>

              <p
                style={{
                  margin: "0 0 28px",
                  fontSize: "15px",
                  lineHeight: 1.65,
                  color: "rgba(255, 255, 255, 0.82)",
                  maxWidth: "460px",
                }}
              >
                {config.hero.description}
              </p>

              {/* 4 Feature Badges Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "28px",
                  maxWidth: "440px",
                }}
              >
                {config.hero.features?.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#FFFFFF" }}>{item.title}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.65)" }}>{item.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Primary Action Button */}
              <div>
                <Link
                  href={config.hero.primaryCta?.url || "/careers"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "13px 32px",
                    borderRadius: "50px",
                    background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                    color: "#180927",
                    fontSize: "14px",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 8px 24px -6px rgba(212, 175, 55, 0.5)",
                  }}
                >
                  <span>{config.hero.primaryCta?.label || "Join Our Journey →"}</span>
                </Link>
              </div>
            </div>

            {/* CENTER: Dr. Queens Staged in Collaborative Lab/Office Environment */}
            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {/* Floating Top Card */}
              {(config.hero.topCard?.enabled !== false && config.hero.rightCard?.enabled !== false) && (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.96)",
                    color: "#2A0F3A",
                    borderRadius: "14px",
                    padding: "10px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                    border: "1px solid rgba(212, 175, 55, 0.4)",
                    marginBottom: "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{config.hero.topCard?.icon || config.hero.rightCard?.icon || "👑"}</span>
                  <div style={{ textAlign: "left" }}>
                    <strong>{config.hero.topCard?.title || config.hero.rightCard?.title || "Great ideas,"}</strong>
                    <div>{config.hero.topCard?.subtitle || config.hero.rightCard?.subtitle || "dedicated people, healthier tomorrow!"}</div>
                  </div>
                </div>
              )}

              {/* Dr. Queens Avatar / Character Stage */}
              <div
                style={{
                  position: "relative",
                  width: "220px",
                  height: "220px",
                  borderRadius: "50%",
                  padding: "5px",
                  background: "linear-gradient(135deg, #D4AF37 0%, #7C3AED 100%)",
                  boxShadow: "0 0 50px rgba(212, 175, 55, 0.35)",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "#2A0F3A",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      isBlinking && config.hero.character.blinkImageUrl
                        ? config.hero.character.blinkImageUrl
                        : config.hero.character.imageUrl || "/images/hero/dr-queens-hd.webp"
                    }
                    alt="Dr. Queens"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </div>

              {/* Speech Bubble */}
              <div
                style={{
                  marginTop: "14px",
                  background: "rgba(255, 255, 255, 0.95)",
                  color: "#2A0F3A",
                  borderRadius: "20px",
                  padding: "8px 18px",
                  fontSize: "12px",
                  fontWeight: 600,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                  maxWidth: "280px",
                }}
              >
                {config.hero.character.speechBubble ||
                  "Hi! I'm Dr. Queens 💜 Meet the amazing people behind a healthier India."}
              </div>

              {/* Cursive Tagline */}
              <div
                style={{
                  marginTop: "8px",
                  fontFamily: "var(--font-cursive, 'Brush Script MT', 'Caveat', cursive)",
                  fontSize: "19px",
                  color: "#FDE68A",
                  letterSpacing: "0.02em",
                }}
              >
                {config.hero.character.cursiveTagline || "People Behind a Healthier Tomorrow ♡"}
              </div>
            </div>

            {/* RIGHT: Corporate Plaque & Video Lightbox CTA */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
                textAlign: "center",
              }}
            >
              {/* Corporate Values Plaque */}
              {(config.hero.plaque?.enabled !== false) && (
                <div
                  style={{
                    width: "100%",
                    maxWidth: "280px",
                    background: "rgba(255, 255, 255, 0.07)",
                    border: "1px solid rgba(232, 200, 138, 0.3)",
                    borderRadius: "16px",
                    padding: "24px 20px",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#D4AF37", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "8px" }}>
                    {config.hero.plaque?.eyebrow || "Core Ideals"}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.4, fontFamily: "var(--font-display, serif)", marginBottom: "14px", whiteSpace: "pre-line" }}>
                    {config.hero.plaque?.title || "PEOPLE\nIDEAS\nSCIENCE\nCARE\nIMPACT"}
                  </div>
                  <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.12)", paddingTop: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <span style={{ fontSize: "13px" }}>{config.hero.plaque?.icon || "👑"}</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#E8C88A", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {config.hero.plaque?.companyName || config.hero.plaque?.subtext || config.hero.teamPlaqueSubtitle || "QUEENS CARE LABORATORIES"}
                    </span>
                  </div>
                </div>
              )}

              {/* Watch Our Team Story Button */}
              {config.hero.secondaryCta?.enabled !== false && (
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 24px",
                    borderRadius: "50px",
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    backdropFilter: "blur(10px)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                    e.currentTarget.style.borderColor = "#E8C88A";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <span
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#7C3AED",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      color: "#FFFFFF",
                    }}
                  >
                    {config.hero.secondaryCta?.icon || "▶"}
                  </span>
                  <span>{config.hero.secondaryCta?.label || "Watch Our Team Story"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderFilterBarSection = () => {
    if (config.filterBar?.enabled === false) return null;
    return (
      <section
        style={{
          position: "relative",
          zIndex: 10,
          marginTop: isPrecededByHero ? "-32px" : "32px",
          padding: "0 24px",
          marginBottom: isPrecededByHero ? "0" : "24px",
        }}
      >
        <div
          style={{
            maxWidth: "1340px",
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: "18px",
            padding: "14px 20px",
            boxShadow: "0 18px 40px -10px rgba(42, 15, 58, 0.14)",
            border: "1px solid rgba(212, 175, 55, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {/* Search Input */}
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <span
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "15px",
                color: "#9CA3AF",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={config.filterBar.searchPlaceholder || "Search by name, role, department..."}
              style={{
                width: "100%",
                padding: "11px 36px 11px 40px",
                borderRadius: "10px",
                border: "1px solid #E5E7EB",
                fontSize: "13.5px",
                color: "#1F2937",
                background: "#F9FAFB",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#9CA3AF",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Department Dropdown */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={{
              padding: "11px 14px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              fontSize: "13px",
              fontWeight: 500,
              color: "#374151",
              background: "#F9FAFB",
              cursor: "pointer",
              outline: "none",
              flex: "0 1 170px",
            }}
          >
            <option value="all">{config.filterBar.allDepartmentsLabel || "All Departments"}</option>
            {config.filterBar.departments
              ?.filter((d) => d !== (config.filterBar.allDepartmentsLabel || "All Departments") && d !== "All Departments")
              .map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
          </select>

          {/* Location Dropdown */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={{
              padding: "11px 14px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              fontSize: "13px",
              fontWeight: 500,
              color: "#374151",
              background: "#F9FAFB",
              cursor: "pointer",
              outline: "none",
              flex: "0 1 160px",
            }}
          >
            <option value="all">{config.filterBar.allLocationsLabel || "All Locations"}</option>
            {config.filterBar.locations
              ?.filter((l) => l !== (config.filterBar.allLocationsLabel || "All Locations") && l !== "All Locations")
              .map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            style={{
              padding: "11px 14px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              fontSize: "13px",
              fontWeight: 500,
              color: "#374151",
              background: "#F9FAFB",
              cursor: "pointer",
              outline: "none",
              flex: "0 1 150px",
            }}
          >
            {config.filterBar.sortOptions?.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            )) || (
              <>
                <option value="featured">Sort by: Featured</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
                <option value="dept">Department</option>
              </>
            )}
          </select>

          {/* Grid / List View Toggle */}
          <div
            style={{
              display: "inline-flex",
              background: "#F3F4F6",
              borderRadius: "10px",
              padding: "3px",
              gap: "2px",
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Grid View"
              style={{
                border: "none",
                background: viewMode === "grid" ? "#2A0F3A" : "transparent",
                color: viewMode === "grid" ? "#FFFFFF" : "#6B7280",
                borderRadius: "8px",
                padding: "7px 10px",
                fontSize: "13px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ⊞
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="List View"
              style={{
                border: "none",
                background: viewMode === "list" ? "#2A0F3A" : "transparent",
                color: viewMode === "list" ? "#FFFFFF" : "#6B7280",
                borderRadius: "8px",
                padding: "7px 10px",
                fontSize: "13px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ☰
            </button>
          </div>

          {/* Find People Count Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSelectedDepartment("all");
              setSelectedLocation("all");
              setSearchQuery("");
            }}
            style={{
              padding: "11px 20px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #2A0F3A 0%, #4B1A66 100%)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{config.filterBar.buttonLabel || "Find People"}</span>
            <span
              style={{
                fontSize: "11px",
                background: "rgba(255, 255, 255, 0.2)",
                padding: "1px 6px",
                borderRadius: "10px",
              }}
            >
              {filteredEmployees.length}
            </span>
          </button>
        </div>
      </section>
    );
  };

  const renderCategoryChipsSection = () => {
    if (!config.categoryChips || config.categoryChips.length === 0) return null;
    return (
<section
        style={{
          padding: "36px 24px 16px",
          maxWidth: "1340px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => scrollCategories("left")}
            style={{
              position: "absolute",
              left: "-12px",
              zIndex: 5,
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
            }}
            aria-label="Scroll left"
          >
            ◀
          </button>

          <div
            ref={categoryScrollRef}
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              scrollbarWidth: "none",
              padding: "4px 8px",
              scrollBehavior: "smooth",
              width: "100%",
            }}
          >
            {config.categoryChips
              .filter((c) => c.visible !== false)
              .map((chip) => {
                const isSelected = selectedCategory === chip.id;
                const count =
                  chip.countOverride !== undefined
                    ? chip.countOverride
                    : chip.departmentKey === "all"
                    ? employees.length
                    : categoryCounts[chip.departmentKey] || 0;

                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setSelectedCategory(chip.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "9px 18px",
                      borderRadius: "50px",
                      border: isSelected
                        ? "1.5px solid #D4AF37"
                        : "1px solid #E5E7EB",
                      background: isSelected
                        ? "linear-gradient(135deg, #2A0F3A 0%, #4B1A66 100%)"
                        : "#FFFFFF",
                      color: isSelected ? "#FFFFFF" : "#4B5563",
                      fontSize: "13px",
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      boxShadow: isSelected
                        ? "0 4px 14px rgba(42, 15, 58, 0.25)"
                        : "0 1px 3px rgba(0, 0, 0, 0.05)",
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                    }}
                  >
                    <span>{chip.icon || "👥"}</span>
                    <span>{chip.label}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 7px",
                        borderRadius: "10px",
                        background: isSelected
                          ? "rgba(212, 175, 55, 0.3)"
                          : "#F3F4F6",
                        color: isSelected ? "#FDE68A" : "#6B7280",
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
          </div>

          <button
            type="button"
            onClick={() => scrollCategories("right")}
            style={{
              position: "absolute",
              right: "-12px",
              zIndex: 5,
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
            }}
            aria-label="Scroll right"
          >
            ▶
          </button>
        </div>
      </section>
    );
  };

  const renderDirectoryGridSection = () => {
    if (config.directoryGrid?.enabled === false) return null;
    return (
<section
        style={{
          padding: "24px 24px 60px",
          maxWidth: "1340px",
          margin: "0 auto",
        }}
      >
        {filteredEmployees.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "60px 24px",
              textAlign: "center",
              border: "1px dashed #d1d5db",
              maxWidth: "600px",
              margin: "20px auto",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "14px" }}>🔍</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937", margin: "0 0 8px" }}>
              No Team Members Found
            </h3>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 20px" }}>
              We couldn&apos;t find any team members matching your search.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedDepartment("all");
                setSelectedLocation("all");
                setSearchQuery("");
              }}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                background: "var(--purple)",
                color: "#ffffff",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* 4-COLUMN GRID LAYOUT */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {paginatedEmployees.map((emp) => {
              const slug = emp.slug || emp.id;
              const photo = emp.profileImage || emp.photo || "/assets/placeholder-avatar.png";
              const deptIcon = emp.departmentIcon || "✦";

              return (
                <div
                  key={emp.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #EAE6DF",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                    transition: "all 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow =
                      "0 20px 35px -10px rgba(42, 15, 58, 0.14), 0 0 0 1px rgba(212, 175, 55, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.04)";
                  }}
                >
                  {/* Top Badges Row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "#6B21A8",
                        background: "#F3E8FF",
                        padding: "4px 10px",
                        borderRadius: "20px",
                      }}
                    >
                      <span>{deptIcon}</span>
                      <span>{emp.department || "Queens Care"}</span>
                    </span>

                    {emp.verified !== false && (
                      <span
                        title="Verified Queens Care Professional"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#2563EB",
                          background: "#EFF6FF",
                          padding: "3px 8px",
                          borderRadius: "12px",
                        }}
                      >
                        <span>✓</span>
                        <span>Verified</span>
                      </span>
                    )}
                  </div>

                  {/* Photo Container */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingTop: "90%",
                      borderRadius: "12px",
                      overflow: "hidden",
                      background: "#F3F0EB",
                      marginBottom: "16px",
                    }}
                  >
                    <EmployeeAvatar emp={emp} size="card" />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        margin: "0 0 4px",
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#180927",
                        fontFamily: "var(--font-display, 'Playfair Display', Georgia, serif)",
                      }}
                    >
                      {emp.name}
                    </h3>

                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#B45309",
                        marginBottom: "10px",
                        minHeight: "18px",
                      }}
                    >
                      {emp.designation}
                    </div>

                    {emp.quote && (
                      <div
                        style={{
                          fontSize: "12px",
                          lineHeight: 1.5,
                          color: "#4B5563",
                          fontStyle: "italic",
                          background: "#FDFBF7",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          borderLeft: "3px solid #D4AF37",
                          marginBottom: "12px",
                        }}
                      >
                        &ldquo;{emp.quote}&rdquo;
                      </div>
                    )}

                    {emp.location && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11.5px",
                          color: "#6B7280",
                          marginBottom: "14px",
                        }}
                      >
                        <span>📍</span>
                        <span>{emp.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Social & Profile Link */}
                  <div
                    style={{
                      borderTop: "1px solid #F3F0EB",
                      paddingTop: "12px",
                      marginTop: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {emp.socialLinks?.linkedin?.enabled !== false && (
                        <a
                          href={
                            emp.socialLinks?.linkedin?.url ||
                            `https://linkedin.com/search/results/all/?keywords=${encodeURIComponent(emp.name)}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                            background: "#F3F4F6",
                            color: "#0A66C2",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: 800,
                            textDecoration: "none",
                          }}
                          title="LinkedIn"
                        >
                          in
                        </a>
                      )}
                      {emp.socialLinks?.email?.enabled !== false && (
                        <a
                          href={emp.socialLinks?.email?.url || `mailto:${slug}@queenscare.in`}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                            background: "#F3F4F6",
                            color: "#4B5563",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            textDecoration: "none",
                          }}
                          title="Email"
                        >
                          ✉
                        </a>
                      )}
                    </div>

                    <Link
                      href={`/employee/${slug}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#2A0F3A",
                        textDecoration: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        background: "#F5F3FF",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#2A0F3A";
                        e.currentTarget.style.color = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#F5F3FF";
                        e.currentTarget.style.color = "#2A0F3A";
                      }}
                    >
                      <span>{config.directoryGrid.viewProfileButtonLabel || "View Profile →"}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW LAYOUT */
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {paginatedEmployees.map((emp) => {
              const slug = emp.slug || emp.id;
              const photo = emp.profileImage || emp.photo || "/assets/placeholder-avatar.png";
              return (
                <div
                  key={emp.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #EAE6DF",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ width: "64px", height: "64px", flexShrink: 0, borderRadius: "10px", overflow: "hidden", position: "relative" }}>
                    <EmployeeAvatar emp={emp} size="list" />
                  </div>
                  <div style={{ flex: "1 1 240px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#180927" }}>
                        {emp.name}
                      </h3>
                      {emp.verified !== false && (
                        <span style={{ fontSize: "11px", color: "#2563EB", background: "#EFF6FF", padding: "2px 6px", borderRadius: "8px" }}>
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "13px", color: "#B45309", fontWeight: 600 }}>{emp.designation}</div>
                    <div style={{ fontSize: "12px", color: "#6B7280" }}>{emp.department} • 📍 {emp.location}</div>
                  </div>
                  {emp.quote && (
                    <div style={{ flex: "1 1 280px", fontSize: "12px", color: "#4B5563", fontStyle: "italic" }}>
                      &ldquo;{emp.quote}&rdquo;
                    </div>
                  )}
                  <Link
                    href={`/employee/${slug}`}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      background: "#2A0F3A",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    {config.directoryGrid.viewProfileButtonLabel || "View Profile →"}
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              marginTop: "40px",
            }}
          >
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                background: "#ffffff",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.4 : 1,
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              ← Previous
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentPage(idx + 1)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  border: "none",
                  background: currentPage === idx + 1 ? "#2A0F3A" : "#ffffff",
                  color: currentPage === idx + 1 ? "#ffffff" : "#374151",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                {idx + 1}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                background: "#ffffff",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                opacity: currentPage === totalPages ? 0.4 : 1,
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Next →
            </button>
          </div>
        )}
      </section>
    );
  };

  const renderCultureSection = () => {
    if (config.cultureSection?.enabled === false) return null;
    return (
<section
        style={{
          position: "relative",
          background: config.cultureSection?.styles?.background || config.theme?.cultureBgGradient || "linear-gradient(135deg, #1C0A2E 0%, #2A0F3A 50%, #150522 100%)",
          color: config.cultureSection?.styles?.textColor || "#ffffff",
          padding: config.cultureSection?.styles?.padding || "70px 24px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: "1340px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr 1.2fr",
            gap: "36px",
            alignItems: "center",
          }}
          className="qc-culture-three-col"
        >
          {/* Left Narrative */}
          <div>
            <div style={{ marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#E8C88A" }}>
                ✦ {config.cultureSection.eyebrow || "OUR SHARED COMMITMENT"} ✦
              </span>
            </div>
            <h2
              style={{
                margin: "0 0 16px",
                fontSize: "clamp(26px, 3.2vw, 38px)",
                fontWeight: 800,
                lineHeight: 1.2,
                fontFamily: "var(--font-display, 'Playfair Display', Georgia, serif)",
              }}
            >
              {config.cultureSection.heading}
            </h2>
            <p style={{ fontSize: "15px", lineHeight: 1.65, color: "rgba(255, 255, 255, 0.82)", margin: "0 0 24px" }}>
              {config.cultureSection.subtitle}
            </p>
            <Link
              href={config.cultureSection.cta?.url || "/about"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 28px",
                borderRadius: "50px",
                background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                color: "#180927",
                fontSize: "13.5px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <span>{config.cultureSection.cta?.label || "Explore Our Culture →"}</span>
            </Link>
          </div>

          {/* Center High-Five Team Collaboration Photo */}
          <div
            style={{
              position: "relative",
              width: "100%",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 16px 36px rgba(0, 0, 0, 0.35)",
              border: "2px solid rgba(212, 175, 55, 0.3)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                config.cultureSection.highFiveImageUrl ||
                "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
              }
              alt="Queens Care Collaborative Team"
              style={{ width: "100%", height: "240px", objectFit: "cover", display: "block" }}
            />
          </div>

          {/* Right Metric Pills & Cursive Quote Card */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* 5 Metric Counters Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px",
              }}
            >
              {config.cultureSection.stats?.map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(232, 200, 138, 0.25)",
                    borderRadius: "12px",
                    padding: "14px 10px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "18px", marginBottom: "4px" }}>{stat.icon}</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#FDE68A", fontFamily: "var(--font-display, serif)", lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", marginTop: "4px" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Cursive Quote Card */}
            {(config.cultureSection.quoteCard?.enabled !== false) && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: config.cultureSection.quoteCard?.cursiveFont !== false ? (config.theme?.fontFamilyCursive || "var(--font-cursive, 'Brush Script MT', 'Caveat', cursive)") : "inherit",
                    fontSize: "20px",
                    color: "#FDE68A",
                    lineHeight: 1.4,
                    marginBottom: "4px",
                  }}
                >
                  &ldquo;{config.cultureSection.quoteCard?.quote || config.cultureSection.quoteTagline || "Together we make better health possible. ♡"}&rdquo;
                </div>
                {(config.cultureSection.quoteCard?.author !== undefined ? config.cultureSection.quoteCard.author : "— Queens Care Laboratories") && (
                  <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.65)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {config.cultureSection.quoteCard?.author || "— Queens Care Laboratories"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  const renderLifeSection = () => {
    if (config.lifeSection?.enabled === false) return null;
    return (
<section
          key="lifeSection"
          style={{
            padding: "70px 24px",
            maxWidth: "1340px",
            margin: "0 auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "36px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2
                style={{
                  fontSize: "clamp(24px, 3vw, 36px)",
                  fontWeight: 800,
                  color: config.theme?.headingColor || "#2A0F3A",
                  margin: "0 0 8px",
                  fontFamily: config.theme?.fontFamilyDisplay || "var(--font-display, serif)",
                }}
              >
                {config.lifeSection?.heading || "Life at Queens Care"}
              </h2>
              <p style={{ fontSize: "15px", color: "#6B7280", margin: 0 }}>
                {config.lifeSection?.subtitle || "A culture where people, ideas and innovation thrive."}
              </p>
            </div>
            {config.lifeSection?.viewAllCta?.enabled !== false && (
              <Link
                href={config.lifeSection?.viewAllCta?.url || "/blog"}
                style={{
                  fontSize: "13.5px",
                  fontWeight: 700,
                  color: "#2A0F3A",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{config.lifeSection?.viewAllCta?.label || "View All Stories →"}</span>
              </Link>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {config.lifeSection?.cards
              ?.filter((card) => card.visible !== false)
              .map((card) => (
                <div
                  key={card.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ position: "relative", height: "180px", overflow: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/images/about/life-facilities.jpg";
                      }}
                    />
                    {card.icon && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "12px",
                          right: "12px",
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.9)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                        }}
                      >
                        {card.icon}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                      {card.subtitle}
                    </div>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#180927", margin: "0 0 8px" }}>
                      {card.title}
                    </h3>
                    <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#6B7280", margin: "0 0 16px", flex: 1 }}>
                      {card.description}
                    </p>
                    {card.url && (
                      <Link
                        href={card.url}
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 700,
                          color: "#2A0F3A",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>Learn More →</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </section>
    );
  };

  const renderCtaSection = () => {
    if (config.ctaSection?.enabled === false) return null;
    return (
<section
          key="ctaSection"
          style={{
            background: "linear-gradient(135deg, #2A0F3A 0%, #180927 100%)",
            color: "#ffffff",
            padding: "70px 24px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 2 }}>
            {config.ctaSection?.characterImageUrl && (
              <div style={{ width: "90px", height: "90px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 18px", border: "2px solid #D4AF37", boxShadow: "0 8px 24px rgba(212, 175, 55, 0.4)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={config.ctaSection.characterImageUrl}
                  alt="Dr. Queens"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}
            {config.ctaSection?.characterTagline && (
              <div style={{ fontFamily: config.theme?.fontFamilyCursive || "var(--font-cursive, cursive)", fontSize: "20px", color: "#FDE68A", marginBottom: "8px" }}>
                {config.ctaSection.characterTagline}
              </div>
            )}
            <h2
              style={{
                fontSize: "clamp(26px, 3.5vw, 42px)",
                fontWeight: 800,
                margin: "0 0 14px",
                fontFamily: config.theme?.fontFamilyDisplay || "var(--font-display, serif)",
              }}
            >
              {config.ctaSection?.heading || "Ready to Make a Difference?"}
            </h2>
            <p style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.82)", maxWidth: "560px", margin: "0 auto 28px", lineHeight: 1.6 }}>
              {config.ctaSection?.subtitle || "Join a team that's passionate about science, people and a healthier tomorrow."}
            </p>
            {config.ctaSection?.cta?.enabled !== false && (
              <div style={{ marginBottom: "36px" }}>
                <Link
                  href={config.ctaSection?.cta?.url || "/careers"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "14px 36px",
                    borderRadius: "50px",
                    background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                    color: "#180927",
                    fontSize: "14px",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 8px 24px -4px rgba(212, 175, 55, 0.5)",
                  }}
                >
                  <span>{config.ctaSection?.cta?.label || "Explore Open Roles →"}</span>
                </Link>
              </div>
            )}
            {/* Trust Badges */}
            {config.ctaSection?.badges && (
              <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "20px" }}>
                {config.ctaSection.badges
                  .filter((b) => b.visible !== false)
                  .map((b, idx) => (
                    <div key={idx} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255, 255, 255, 0.85)" }}>
                      <span>{b.icon}</span>
                      <span>{b.label}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>
    );
  };

  const renderTrustBadgesSection = () => {
    if (config.trustBadgesBar?.enabled === false) return null;
    return (
<div
          key="trustBadgesBar"
          style={{
            background: "#ffffff",
            borderTop: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
            padding: "24px",
          }}
        >
          <div
            style={{
              maxWidth: "1340px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
              alignItems: "center",
            }}
          >
            {(config.trustBadgesBar?.badges || [
              { id: "tb-1", label: "Quality You Can Trust", subtitle: "Rigorous Testing Standards", icon: "🛡️", visible: true },
              { id: "tb-2", label: "Documented Processes", subtitle: "Controlled Production Environment", icon: "🏭", visible: true },
              { id: "tb-3", label: "Transparent Labels", subtitle: "Every Ingredient Disclosed", icon: "🩺", visible: true },
              { id: "tb-4", label: "Fast Pan-India Delivery", subtitle: "Direct to Your Doorstep", icon: "🚀", visible: true },
              { id: "tb-5", label: "Dedicated Support", subtitle: "Pharmacist Advisory Line", icon: "💬", visible: true },
            ])
              .filter((b) => b.visible !== false)
              .map((badge, idx) => (
                <div key={badge.id || idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>{badge.icon}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#180927" }}>{badge.label}</div>
                    {badge.subtitle && (
                      <div style={{ fontSize: "11px", color: "#6B7280" }}>{badge.subtitle}</div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: config.theme?.primaryBg || "#FAF8F5",
        color: config.theme?.textColor || "#180927",
        fontFamily: config.theme?.fontFamilyBody || "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        overflowX: "hidden",
      }}
    >
      {/* ─── 1. GLOBAL QUEENS CARE HEADER (WITH ORIGINAL LOGO) ─── */}
      <QueensCareHeader activePage="people" />

      
      {/* ─── DYNAMIC CMS ORDERED SECTIONS ─── */}
      {orderedSections.map((sec) => {
        if (sec.id === "hero") return <React.Fragment key="hero">{renderHeroSection()}</React.Fragment>;
        if (sec.id === "filterBar") return <React.Fragment key="filterBar">{renderFilterBarSection()}</React.Fragment>;
        if (sec.id === "categoryChips") return <React.Fragment key="categoryChips">{renderCategoryChipsSection()}</React.Fragment>;
        if (sec.id === "directoryGrid") return <React.Fragment key="directoryGrid">{renderDirectoryGridSection()}</React.Fragment>;
        if (sec.id === "cultureSection") return <React.Fragment key="cultureSection">{renderCultureSection()}</React.Fragment>;
        if (sec.id === "lifeSection") return <React.Fragment key="lifeSection">{renderLifeSection()}</React.Fragment>;
        if (sec.id === "ctaSection") return <React.Fragment key="ctaSection">{renderCtaSection()}</React.Fragment>;
        if (sec.id === "trustBadgesBar") return <React.Fragment key="trustBadgesBar">{renderTrustBadgesSection()}</React.Fragment>;
        return null;
      })}

      {/* ─── 7. VIDEO LIGHTBOX MODAL ─── */}
      {isVideoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsVideoModalOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(10, 3, 18, 0.9)",
            backdropFilter: "blur(10px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            boxSizing: "border-box",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "860px",
              background: "#000000",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid rgba(212, 175, 55, 0.4)",
            }}
          >
            <button
              type="button"
              onClick={() => setIsVideoModalOpen(false)}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                zIndex: 10,
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                color: "#ffffff",
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>

            <div style={{ position: "relative", paddingTop: "56.25%", width: "100%" }}>
              <iframe
                src={getEmbedUrl(config.hero.secondaryCta.videoUrl || config.hero.secondaryCta.url) || undefined}
                title="Queens Care Team Story"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: 0,
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── 8. GLOBAL QUEENS CARE FOOTER (WITH 5 TRUST BADGES) ─── */}
      <QueensCareFooter />

      {/* Responsive Styles */}
      <style jsx global>{`
        @media (max-width: 1024px) {
          .qc-hero-three-col {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .qc-culture-three-col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
