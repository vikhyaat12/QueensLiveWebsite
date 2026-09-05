/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import Image from "next/image";
import CareScene from "./CareScene";
import DeliveryTimer from "./DeliveryTimer";
import CartBadge from "./CartBadge";
import Hero3DProductVisual from "./Hero3DProductVisual";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getCartCount, subscribeCart } from "@/lib/client-cart";
import { SocialBrandIcon } from "./SocialIcons";
import Marquee from "./Marquee";
import UniversalMarquee from "./UniversalMarquee";
import SearchOverlay from "./SearchOverlay";
import DoctorCharacter from "./DoctorCharacter";
import FemaleDoctorHeroVisual from "./FemaleDoctorHeroVisual";
import HealthQuizModal from "./HealthQuizModal";

type Product = { 
  id: string;
  slug: string;
  name: string; 
  category: string; 
  price: number; 
  description: string;
  note: string; 
  image: string; 
  tag: string;
  stock: number;
  rating?: number;
  reviewCount?: number;
  benefits?: string[];
  bestSeller?: boolean;
  newArrival?: boolean;
  featured?: boolean;
};

type BlogPostItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category?: string;
  readTime?: string;
  image?: string;
  author?: string;
  createdAt: string;
  featured?: boolean;
};

function Icon({ children }: { children: string }) { return <span aria-hidden="true">{children}</span>; }

export default function QueensCareExperience() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPostItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wish, setWish] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [startVoiceSearch, setStartVoiceSearch] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{name?:string;email?:string;role?:string} | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoHeight, setLogoHeight] = useState<string>("34px");
  const [logoMaxWidth, setLogoMaxWidth] = useState<string>("180px");
  const [logoFailed, setLogoFailed] = useState(false);
  const [logoRetryCount, setLogoRetryCount] = useState(0);
  const [hpSections, setHpSections] = useState<Record<string, unknown>[]>([]);
  const [socialLinks, setSocialLinks] = useState<
    Array<{
      id: string;
      platform: string;
      label: string;
      url: string;
      iconSize?: number;
      desktopIconSize?: number;
      mobileIconSize?: number;
      customIconUrl?: string;
      openNewTab?: boolean;
    }>
  >([]);

  const [pageSettings, setPageSettings] = useState<Array<{ id: string; slug: string; headerVisible?: boolean; footerVisible?: boolean; active?: boolean }>>([]);
  const [testimonials, setTestimonials] = useState<Array<{ id: string; name: string; title: string; body: string; rating?: number }>>([]);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [footerSettings, setFooterSettings] = useState<{
    tagline?: string;
    newsletterTitle?: string;
    copyright?: string;
    bg?: string;
    textColor?: string;
  }>({});
  const [headerNav, setHeaderNav] = useState<Array<{label:string;href:string;visible:boolean;sort:number}>>([]);
  const [footerLinks, setFooterLinks] = useState<Array<{section:string;links:Array<{label:string;href:string;visible:boolean;sort:number}>}>>([]);

  useEffect(() => {
    fetch("/api/auth/me").then(r=>r.json()).then(d=>{ if(d.user) setUser(d.user); }).catch(()=>{});
    // Fetch public theme settings and apply as CSS variables
    fetch("/api/settings").then(r=>r.json()).then(d=>{
      (d.settings||[]).forEach((s:{key:string;value:string})=>{
        if(s.key==='theme_primary' && s.value) document.documentElement.style.setProperty('--purple', s.value);
        if(s.key==='theme_gold' && s.value) document.documentElement.style.setProperty('--gold', s.value);
        if(s.key==='theme_accent' && s.value) document.documentElement.style.setProperty('--accent', s.value);
        if(s.key==='theme_bg' && s.value) document.documentElement.style.setProperty('--paper', s.value);
        if(s.key==='theme_text' && s.value) document.documentElement.style.setProperty('--ink', s.value);
        if(s.key==='logo_url') { setLogoUrl(s.value || ""); setLogoFailed(false); }
        if(s.key==='logo_height_desktop' && s.value) { setLogoHeight(`${s.value}px`); document.documentElement.style.setProperty('--logo-height-desktop', `${s.value}px`); }
        if(s.key==='logo_height_mobile' && s.value) { document.documentElement.style.setProperty('--logo-height-mobile', `${s.value}px`); }
        if(s.key==='logo_max_width' && s.value) { setLogoMaxWidth(`${s.value}px`); document.documentElement.style.setProperty('--logo-max-width', `${s.value}px`); }
        if(s.key==='footer_tagline' && s.value) setFooterSettings(prev => ({ ...prev, tagline: s.value }));
        if(s.key==='footer_newsletter_title' && s.value) setFooterSettings(prev => ({ ...prev, newsletterTitle: s.value }));
        if(s.key==='footer_copyright' && s.value) setFooterSettings(prev => ({ ...prev, copyright: s.value }));
        if(s.key==='footer_bg' && s.value) setFooterSettings(prev => ({ ...prev, bg: s.value }));
        if(s.key==='footer_text_color' && s.value) setFooterSettings(prev => ({ ...prev, textColor: s.value }));
        if(s.key==='header_nav' && s.value) { try { setHeaderNav(JSON.parse(s.value)); } catch {} }
        if(s.key==='footer_links' && s.value) { try { setFooterLinks(JSON.parse(s.value)); } catch {} }
      });
    }).catch(()=>{});
    fetch("/api/homepage").then(r=>r.json()).then(d=>{ if(d.sections?.length) setHpSections(d.sections); }).catch(()=>{});
    fetch("/api/social-links").then(r=>r.json()).then(d=>{ setSocialLinks(d.links || []); }).catch(()=>{});
    fetch("/api/blog").then(r=>r.json()).then(d=>{ if(d.posts?.length) setBlogPosts(d.posts); }).catch(()=>{});
    fetch("/api/pages").then(r=>r.json()).then(d=>{ if(d.pages) setPageSettings(d.pages); }).catch(()=>{});
    fetch("/api/testimonials").then(r=>r.json()).then(d=>{ if(d.testimonials?.length) setTestimonials(d.testimonials); }).catch(()=>{});
  }, []);

  const isEmployeeVisibleInFooter = useMemo(() => {
    if (!pageSettings.length) return true;
    const empPage = pageSettings.find(p => p.slug === "employee" || p.id === "pg-employee");
    return empPage ? (empPage.active !== false && empPage.footerVisible !== false) : true;
  }, [pageSettings]);

  const isEmployeeVisibleInHeader = useMemo(() => {
    if (!pageSettings.length) return false;
    const empPage = pageSettings.find(p => p.slug === "employee" || p.id === "pg-employee");
    return Boolean(empPage && empPage.active !== false && empPage.headerVisible === true);
  }, [pageSettings]);

  const getHp = (type: string) => hpSections.find((s) => s.type === type && s.active && s.visible);
  const getHpContent = (type: string) => { const s = getHp(type); try { return (typeof s?.content === 'string' ? JSON.parse(s.content as string) : s?.content) || {}; } catch { return {}; } };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        const productList = (data.products || []) as Product[];
        const mappedProducts = productList.map((p) => ({
          ...p,
          note: p.description ? (p.description.split(".")[0] || p.description) : "",
          tag: p.bestSeller ? "Bestseller" : (p.newArrival ? "New" : (p.featured ? "Featured" : (p.rating && p.rating >= 4.8 ? "Popular" : "New"))),
        }));
        setProducts(mappedProducts);
        const cats = [...new Set(productList.map((p) => p.category).filter(Boolean))];
        setCategories(cats);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const shown = useMemo(() => products.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase())), [search, products]);
  
  const add = (product: Product) => {
    setNotice(`${product.name} is in your care bag.`);
    import("@/lib/client-cart")
      .then((m) => m.addToCart({ productId: product.slug, quantity: 1 }))
      .catch(() => {});
  };

  // keep bag badge in sync with persisted client storage
  useEffect(() => {
    const unsubscribe = subscribeCart((_, count) => setCartCount(count));
    const id = requestAnimationFrame(() => setCartCount(getCartCount()));
    return () => {
      cancelAnimationFrame(id);
      unsubscribe();
    };
  }, []);

  const toggleWish = (name: string) => setWish((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name]);
  const subscribe = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setNotice("You're on the Queens Care list. Thank you."); };
  
  // Dynamic Section Engine
  const sortedSections = useMemo(() => {
    const defaultSections = [
      { id: "hs-hero", type: "hero" },
      { id: "hs-trust", type: "trust" },
      { id: "hs-collection", type: "collection" },
      { id: "hs-science", type: "science" },
      { id: "hs-ritual", type: "ritual" },
      { id: "hs-testimonial", type: "testimonial" },
      { id: "hs-newsletter", type: "newsletter" },
      ...(getHp("affiliate") ? [{ id: "hs-affiliate", type: "affiliate" }] : []),
      { id: "hs-consult", type: "consult" },
    ];
    if (!hpSections.length) return defaultSections;

    const list = [...hpSections]
      .filter((s) => s.active !== false && s.visible !== false && s.type !== "banner" && s.type !== "heroVisual")
      .sort((a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0));

    return list.length > 0 ? list : defaultSections;
  }, [hpSections]);

  const renderSection = (sec: Record<string, unknown>, idx: number) => {
    const type = String(sec.type || "custom");
    const rawContent = sec.content;
    const c = (typeof rawContent === "string" ? JSON.parse(rawContent) : (rawContent as Record<string, unknown>)) || getHpContent(type);

    const secStyle: React.CSSProperties = {
      ...(c.backgroundColor ? { backgroundColor: String(c.backgroundColor) } : {}),
      ...(c.textColor ? { color: String(c.textColor) } : {}),
      ...(c.padding ? { padding: String(c.padding) } : {}),
      ...(c.textAlign ? { textAlign: String(c.textAlign) as React.CSSProperties["textAlign"] } : {}),
      ...(c.maxWidth ? { maxWidth: String(c.maxWidth), margin: "0 auto" } : {}),
      ...(c.sectionRadius ? { borderRadius: String(c.sectionRadius), overflow: "hidden" } : {}),
    };
    const headingStyle: React.CSSProperties = {
      ...(c.headingFontSize ? { fontSize: String(c.headingFontSize) } : {}),
      ...(c.headingFontWeight ? { fontWeight: Number(c.headingFontWeight) } : {}),
      ...(c.headingLetterSpacing ? { letterSpacing: String(c.headingLetterSpacing) } : {}),
    };
    const bodyStyle: React.CSSProperties = {
      ...(c.bodyFontSize ? { fontSize: String(c.bodyFontSize) } : {}),
      ...(c.bodyLineHeight ? { lineHeight: String(c.bodyLineHeight) } : {}),
    };
    const btnStyle: React.CSSProperties = {
      ...(c.buttonBg ? { background: String(c.buttonBg) } : {}),
      ...(c.buttonColor ? { color: String(c.buttonColor) } : {}),
      ...(c.buttonRadius ? { borderRadius: String(c.buttonRadius) } : {}),
    };

    switch (type) {
      case "hero": {
        const heroBg = c.backgroundColor || c.heroBackground;
        const heroImage = c.heroImage || c.imageUrl;
        const heroVis = getHpContent("heroVisual");
        return (
          <section
            className="hero"
            key={sec.id ? String(sec.id) : `hero-${idx}`}
            style={{
              background: heroBg
                ? String(heroBg)
                : "radial-gradient(ellipse at 75% 25%, rgba(224, 231, 255, 0.55) 0%, rgba(243, 232, 255, 0.4) 40%, #F8F9FD 80%)",
              position: "relative",
              overflow: "hidden",
              padding: "50px 24px 40px",
              ...secStyle,
            }}
          >
            <div className="hero-copy" style={{ maxWidth: 520, zIndex: 3 }}>
              <p
                className="eyebrow"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: "rgba(99, 102, 241, 0.08)",
                  color: "#4F46E5",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  width: "fit-content",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                <span>✦</span> {String(c.eyebrow || "SCIENCE-BACKED WELLNESS")}
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-display, serif)",
                  fontSize: "clamp(38px, 4.8vw, 56px)",
                  fontWeight: 850,
                  lineHeight: 1.06,
                  letterSpacing: "-0.03em",
                  color: c.headingColor ? String(c.headingColor) : "#1E1638",
                  margin: "0 0 16px",
                }}
                dangerouslySetInnerHTML={{
                  __html: String(
                    c.heading ||
                      "Better<br/>Health<br/>Brighter <span style='color: #EC4899;'>💗</span><br/>Tomorrows"
                  ),
                }}
              />
              <p
                className="lead"
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "#475569",
                  maxWidth: 440,
                  margin: "0 0 24px",
                  ...bodyStyle,
                }}
              >
                {String(
                  c.subtitle ||
                    "Premium pharmaceutical wellness solutions for you and your loved ones."
                )}
              </p>
              <div
                className="hero-ctas"
                style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", marginBottom: 26 }}
              >
                <a
                  href={String(c.ctaLink || "#collection")}
                  className="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#1E1638",
                    color: "#ffffff",
                    borderRadius: 999,
                    padding: "13px 26px",
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                    boxShadow: "0 6px 20px rgba(30, 22, 56, 0.25)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                >
                  {String(c.ctaText || "Explore Products")} <span>→</span>
                </a>
                <a
                  href={String(c.secondaryLink || "#science")}
                  className="button secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(8px)",
                    color: "#1E1638",
                    border: "1px solid rgba(30, 22, 56, 0.15)",
                    borderRadius: 999,
                    padding: "12px 20px",
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#EDE9FE",
                      color: "#6D28D9",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                    }}
                  >
                    ▶
                  </span>
                  <span>{String(c.secondaryText || "Watch Our Story")}</span>
                </a>
              </div>

              {/* 4 Trust Signals from Reference Image */}
              <div
                className="hero-trust-badges"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 8,
                  maxWidth: 420,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(30, 22, 56, 0.08)",
                }}
              >
                {[
                  { icon: "🔬", label: "Clinically Inspired" },
                  { icon: "🛡️", label: "Safe & Effective" },
                  { icon: "👥", label: "Trusted by Thousands" },
                  { icon: "🩺", label: "Doctor Recommended" },
                ].map((b, bi) => (
                  <div key={bi} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "#FFFFFF",
                        border: "1px solid rgba(30, 22, 56, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 4px",
                        fontSize: 15,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}
                    >
                      {b.icon}
                    </div>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 600,
                        color: "#475569",
                        lineHeight: 1.25,
                        display: "block",
                      }}
                    >
                      {b.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cinematic Hero Visual Stage */}
            <div
              className="hero-cinematic-stage-wrap"
              style={{
                position: "relative",
                width: "100%",
                maxWidth: c.characterPosition === "split" || !c.characterPosition ? 720 : 480,
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                flexWrap: "wrap",
                zIndex: 2,
              }}
            >
              {heroImage ? (
                <div style={{ width: "100%", maxWidth: 460, borderRadius: 12, overflow: "hidden" }}>
                  <img
                    src={String(heroImage)}
                    alt={String(c.heading || "Hero")}
                    style={{ width: "100%", height: 480, objectFit: "cover" }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=85";
                    }}
                  />
                </div>
              ) : (
                <>
                  {/* Interactive Female Healthcare Specialist Character */}
                  {c.characterEnabled !== false && c.characterPosition !== "product_only" && (
                    <div
                      className="hero-character-col"
                      style={{
                        flex: c.characterPosition === "character_only" ? "1 1 360px" : "1 1 240px",
                        maxWidth: c.characterPosition === "character_only" ? 380 : 270,
                        position: "relative",
                        zIndex: 3,
                      }}
                    >
                      <FemaleDoctorHeroVisual
                        enabled={true}
                        position={(c.characterPosition as "split" | "left" | "right" | "center") || "split"}
                        size={(c.characterSize as "sm" | "md" | "lg") || "md"}
                        animSpeed={Number(c.characterAnimSpeed || 1)}
                        greeting={String(c.characterGreeting || "Hi! I'm Dr. Queens 💙")}
                        subtext={String(
                          c.characterSubtext || "Let me help you find the right products for your needs. 💙"
                        )}
                        badgeText={String(c.characterBadge || "Clinical Specialist")}
                        customImageUrl={String(c.characterImageUrl || "/images/reference/dr-queens-hero.png")}
                        animationStyle={
                          (c.characterAnimation as "gentle_breathing" | "consultation" | "minimal" | "none") ||
                          "gentle_breathing"
                        }
                        showSpeechBubble={c.characterBubble !== false}
                        onOpenQuiz={() => setQuizOpen(true)}
                      />
                    </div>
                  )}

                  {/* 3D Bioactive Product Visualizer with Reference Floating Badges */}
                  {heroVis.enabled !== false && c.characterPosition !== "character_only" && (
                    <div
                      className="hero-product-col"
                      style={{
                        flex: c.characterPosition === "product_only" ? "1 1 420px" : "1 1 280px",
                        maxWidth: c.characterPosition === "product_only" ? 460 : 360,
                        position: "relative",
                        zIndex: 2,
                      }}
                    >
                      {/* Floating Reference Badges */}
                      <div
                        style={{
                          position: "absolute",
                          top: 16,
                          right: -10,
                          zIndex: 10,
                          background: "rgba(255,255,255,0.94)",
                          backdropFilter: "blur(8px)",
                          padding: "6px 12px",
                          borderRadius: 999,
                          border: "1px solid #BAE6FD",
                          boxShadow: "0 4px 14px rgba(2,132,199,0.12)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#0284C7",
                        }}
                      >
                        <span>🛡️</span> <span>Stronger Immunity</span>
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          top: "40%",
                          right: -16,
                          zIndex: 10,
                          background: "rgba(255,255,255,0.94)",
                          backdropFilter: "blur(8px)",
                          padding: "6px 12px",
                          borderRadius: 999,
                          border: "1px solid #C7D2FE",
                          boxShadow: "0 4px 14px rgba(79,70,229,0.12)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#4F46E5",
                        }}
                      >
                        <span>⚡</span> <span>More Energy</span>
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: 50,
                          right: -8,
                          zIndex: 10,
                          background: "rgba(255,255,255,0.94)",
                          backdropFilter: "blur(8px)",
                          padding: "6px 12px",
                          borderRadius: 999,
                          border: "1px solid #DDD6FE",
                          boxShadow: "0 4px 14px rgba(124,58,237,0.12)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#7C3AED",
                        }}
                      >
                        <span>💜</span> <span>Everyday Wellness</span>
                      </div>

                      <Hero3DProductVisual
                        productName={String(heroVis.productName || "Immune Support+")}
                        subtitle={String(heroVis.subtitle || "VITAMIN C, D3 & ZINC")}
                        verticalLabel={String(heroVis.verticalLabel || "PHARMACEUTICAL RIGOR")}
                        scale={Number(heroVis.scale || 0.95)}
                        autoRotate={heroVis.autoRotate !== false}
                        rotationSpeed={Number(heroVis.rotationSpeed || 1.0)}
                        mouseInteraction={heroVis.mouseInteraction !== false}
                        lightingIntensity={Number(heroVis.lightingIntensity || 1.5)}
                        accentColor={String(heroVis.accentColor || "#D4AF37")}
                        bgEffect={(heroVis.bgEffect as "studio" | "purple" | "transparent") || "transparent"}
                        customImageUrl={String(heroVis.customImageUrl || "/images/reference/hero-immune-bottle.png")}
                        customModelUrl={String(heroVis.customModelUrl || "")}
                        height={440}
                      />

                      <div
                        style={{
                          textAlign: "right",
                          marginTop: 6,
                          fontStyle: "italic",
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "#EC4899",
                        }}
                      >
                        Care Today — Brighter Tomorrows 💖
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Subtle Hero Scroll Cue */}
            <div
              className="hero-scroll-cue"
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--muted, #64748b)",
                paddingTop: 24,
                width: "100%",
                opacity: 0.85,
              }}
            >
              <span>Explore laboratory formulations</span>
              <span style={{ fontSize: 13, color: "var(--gold, #D4AF37)" }}>↓</span>
            </div>
          </section>
        );
      }

      case "trust": {
        const badges = (c.badges as string[]) || ["Made in India", "Third-party tested", "Traceable ingredients", "Designed with doctors"];
        return (
          <section className="trust-strip" key={sec.id ? String(sec.id) : `trust-${idx}`} style={secStyle}>
            {badges.map((b: string) => <span key={b}>✦ {b}</span>)}
          </section>
        );
      }

      // Add marquee ticker after trust section
      case "marquee": {
        const marqueeItems: string[] = Array.isArray(c.items) ? c.items as string[] : ["Clinical intelligence", "Made with soul", "Science-backed formulas", "Traceable ingredients", "Designed with doctors"];
        return (
          <Marquee key={sec.id ? String(sec.id) : `marquee-${idx}`} items={marqueeItems} separator={String(c.separator || "✦")} speed={Number(c.speed) || 24} />
        );
      }

      case "collection": {
        const selectedIds: string[] = Array.isArray(c.selectedProductIds) ? (c.selectedProductIds as string[]) : [];
        const catFilter: string[] = Array.isArray(c.selectedCategoryFilter) ? (c.selectedCategoryFilter as string[]) : [];
        const collectionProducts = (() => {
          if (selectedIds.length > 0) {
            const idSet = new Set(selectedIds);
            return products.filter((p) => idSet.has(p.id));
          }
          if (catFilter.length > 0) {
            const catSet = new Set(catFilter);
            return products.filter((p) => catSet.has(p.category));
          }
          return shown;
        })();

        const REFERENCE_CATEGORIES = [
          { name: "All Products", desc: "Explore everything", icon: "⊞", query: "" },
          { name: "Immunity", desc: "Stronger You", icon: "🛡️", query: "Immunity" },
          { name: "Women's Health", desc: "Care at Every Stage", icon: "💗", query: "Women's Health" },
          { name: "Digestive Health", desc: "Happier Gut", icon: "🌿", query: "Digestive" },
          { name: "Respiratory Care", desc: "Breathe Better", icon: "🫁", query: "Respiratory" },
          { name: "Skin & Hair", desc: "Natural Confidence", icon: "✨", query: "Skin" },
          { name: "Bone & Joint", desc: "Move Freely", icon: "🦴", query: "Bone" },
          { name: "Children's Health", desc: "Growing Stronger", icon: "👶", query: "Children" },
        ];

        return (
          <section
            className="collection section"
            id="collection"
            key={sec.id ? String(sec.id) : `collection-${idx}`}
            style={{ padding: "32px 0 60px", background: "#FAFBFD", ...secStyle }}
          >
            {/* Reference Horizontal Category Carousel */}
            <div style={{ maxWidth: 1240, margin: "0 auto 36px", padding: "0 20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#FFFFFF",
                  border: "1px solid rgba(226, 232, 240, 0.9)",
                  borderRadius: 18,
                  padding: "12px 14px",
                  boxShadow: "0 4px 20px rgba(30, 22, 56, 0.04)",
                  overflowX: "auto",
                }}
              >
                <button
                  type="button"
                  aria-label="Previous Category"
                  onClick={() => {
                    const el = document.getElementById("qc-cat-track");
                    if (el) el.scrollBy({ left: -200, behavior: "smooth" });
                  }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  ‹
                </button>

                <div
                  id="qc-cat-track"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    overflowX: "auto",
                    flex: 1,
                    scrollBehavior: "smooth",
                    scrollbarWidth: "none",
                  }}
                >
                  {REFERENCE_CATEGORIES.map((catItem) => {
                    const isSelected =
                      (catItem.query === "" && search === "") ||
                      (catItem.query !== "" && search.toLowerCase().includes(catItem.query.toLowerCase()));
                    return (
                      <button
                        key={catItem.name}
                        type="button"
                        onClick={() => setSearch(catItem.query)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 14px",
                          borderRadius: 14,
                          background: isSelected ? "rgba(99, 102, 241, 0.08)" : "transparent",
                          border: isSelected ? "1.5px solid #6366F1" : "1px solid transparent",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: isSelected ? "#6366F1" : "#F1F5F9",
                            color: isSelected ? "#FFFFFF" : "#1E293B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                          }}
                        >
                          {catItem.icon}
                        </span>
                        <div style={{ textAlign: "left" }}>
                          <b style={{ display: "block", fontSize: 12.5, color: isSelected ? "#4338CA" : "#0F172A" }}>
                            {catItem.name}
                          </b>
                          <span style={{ fontSize: 10, color: "#64748B", display: "block" }}>
                            {catItem.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  aria-label="Next Category"
                  onClick={() => {
                    const el = document.getElementById("qc-cat-track");
                    if (el) el.scrollBy({ left: 200, behavior: "smooth" });
                  }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  ›
                </button>
              </div>
            </div>

            {/* Main Shopping Experience: Two Columns (Left Filters Sidebar + Right Product Grid) */}
            <div
              style={{
                maxWidth: 1240,
                margin: "0 auto",
                padding: "0 20px",
                display: "grid",
                gridTemplateColumns: "240px 1fr",
                gap: 28,
              }}
              className="shop-two-column-wrap"
            >
              {/* Left Filters Sidebar */}
              <aside
                style={{
                  background: "#FFFFFF",
                  borderRadius: 16,
                  border: "1px solid #E2E8F0",
                  padding: "20px 16px",
                  height: "fit-content",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                }}
                className="shop-filter-sidebar"
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, borderBottom: "1px solid #F1F5F9", paddingBottom: 10 }}>
                  <b style={{ fontSize: 15, color: "#0F172A" }}>Filters</b>
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    style={{ background: "none", border: "none", color: "#6366F1", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Clear All
                  </button>
                </div>

                {/* Category Checklist */}
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B", display: "block", marginBottom: 10 }}>
                    Category
                  </span>
                  {[
                    { label: "Immunity", count: 12 },
                    { label: "Women's Health", count: 8 },
                    { label: "Digestive Health", count: 10 },
                    { label: "Respiratory Care", count: 6 },
                    { label: "Skin & Hair", count: 9 },
                    { label: "Bone & Joint", count: 7 },
                    { label: "Children's Health", count: 5 },
                    { label: "Wellness", count: 14 },
                  ].map((catItem) => {
                    const active = search.toLowerCase() === catItem.label.toLowerCase();
                    return (
                      <label
                        key={catItem.label}
                        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475569", margin: "6px 0", cursor: "pointer" }}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => setSearch(active ? "" : catItem.label)}
                          style={{ accentColor: "#4F46E5" }}
                        />
                        <span style={{ flex: 1 }}>{catItem.label}</span>
                        <span style={{ color: "#94A3B8", fontSize: 11 }}>({catItem.count})</span>
                      </label>
                    );
                  })}
                </div>

                {/* Price Range */}
                <div style={{ marginBottom: 20, borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>
                    <span>Price Range</span>
                    <span style={{ color: "#6366F1", fontWeight: 700 }}>₹0 - ₹5000</span>
                  </div>
                  <input type="range" min="0" max="5000" defaultValue="5000" style={{ width: "100%", accentColor: "#4F46E5" }} />
                </div>

                {/* Formulation Checklist */}
                <div style={{ marginBottom: 20, borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B", display: "block", marginBottom: 8 }}>
                    Formulation
                  </span>
                  {["Tablet", "Capsule", "Syrup", "Powder", "Cream", "Drops"].map((f) => (
                    <label key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475569", margin: "5px 0" }}>
                      <input type="checkbox" style={{ accentColor: "#4F46E5" }} />
                      <span>{f}</span>
                    </label>
                  ))}
                </div>

                {/* Brand */}
                <div style={{ marginBottom: 20, borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B", display: "block", marginBottom: 8 }}>
                    Brand
                  </span>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475569" }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: "#4F46E5" }} />
                    <span>Queens Care</span>
                  </label>
                </div>

                {/* Rating Filter */}
                <div style={{ marginBottom: 20, borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B", display: "block", marginBottom: 8 }}>
                    Rating
                  </span>
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#F59E0B", margin: "4px 0" }}>
                      <span>{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
                      <span style={{ color: "#64748B", fontSize: 11 }}>& up</span>
                    </div>
                  ))}
                </div>

                {/* Sticky Doctor Quiz Assistance Card */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #EEF2FF 0%, #FAF5FF 100%)",
                    borderRadius: 14,
                    padding: "16px 12px",
                    border: "1px solid #E0E7FF",
                    textAlign: "center",
                    marginTop: 20,
                  }}
                >
                  <img
                    src="/images/reference/dr-queens-quiz-avatar.png"
                    alt="Dr. Queens"
                    style={{ width: 50, height: 40, objectFit: "contain", margin: "0 auto 6px", display: "block" }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/reference/dr-queens-hero.png";
                    }}
                  />
                  <b style={{ fontSize: 12, color: "#1E1638", display: "block", marginBottom: 4 }}>
                    Need Help Choosing?
                  </b>
                  <p style={{ fontSize: 10.5, color: "#64748B", lineHeight: 1.35, margin: "0 0 10px" }}>
                    Take a short quiz for personalized recommendations.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuizOpen(true)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: "#1E1638",
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 10px rgba(30, 22, 56, 0.2)",
                    }}
                  >
                    Take the Health Quiz ➔
                  </button>
                </div>
              </aside>

              {/* Right Products Catalog Area */}
              <div>
                {/* Catalog Tabs & Sort Bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 20,
                    paddingBottom: 12,
                    borderBottom: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {["All Products (48)", "Bestsellers", "New Arrivals", "Featured", "Offers"].map((tab, ti) => (
                      <button
                        key={tab}
                        type="button"
                        style={{
                          background: ti === 0 ? "#1E1638" : "transparent",
                          color: ti === 0 ? "#FFFFFF" : "#475569",
                          borderRadius: 999,
                          padding: "6px 14px",
                          fontSize: 12,
                          fontWeight: 700,
                          border: ti === 0 ? "none" : "1px solid #E2E8F0",
                          cursor: "pointer",
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#64748B" }}>Sort by:</span>
                    <select
                      style={{
                        padding: "5px 10px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 12,
                        background: "#FFFFFF",
                        color: "#1E293B",
                      }}
                    >
                      <option>Featured</option>
                      <option>Price: Low to High</option>
                      <option>Price: High to Low</option>
                      <option>Customer Rating</option>
                    </select>
                    <div style={{ display: "flex", gap: 4 }}>
                      <span style={{ padding: "4px 8px", background: "#E0E7FF", borderRadius: 6, fontSize: 12, color: "#4F46E5" }}>⊞</span>
                      <span style={{ padding: "4px 8px", background: "#F1F5F9", borderRadius: 6, fontSize: 12, color: "#64748B" }}>☰</span>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <p style={{ marginTop: 40, color: "var(--muted)", textAlign: "center" }}>Loading collection…</p>
                ) : (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                        gap: 16,
                      }}
                    >
                      {collectionProducts.map((product, pIdx) => {
                        const badges = ["Bestseller", "New", "Popular", "Kids"];
                        const cardBadge = pIdx < 4 ? badges[pIdx] : (product.bestSeller ? "Bestseller" : product.newArrival ? "New" : "");
                        const strikePrice = Math.round(product.price * 1.32);
                        const discountPct = Math.round(((strikePrice - product.price) / strikePrice) * 100);

                        return (
                          <article
                            key={product.id}
                            style={{
                              background: "#FFFFFF",
                              borderRadius: 14,
                              border: "1px solid #E2E8F0",
                              padding: "14px",
                              display: "flex",
                              flexDirection: "column",
                              position: "relative",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                              transition: "transform 0.2s, box-shadow 0.2s",
                            }}
                          >
                            {/* Top Badge */}
                            {cardBadge && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: 10,
                                  left: 10,
                                  zIndex: 2,
                                  padding: "3px 8px",
                                  borderRadius: 999,
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  background:
                                    cardBadge === "Bestseller"
                                      ? "#EA580C"
                                      : cardBadge === "New"
                                      ? "#16A34A"
                                      : cardBadge === "Popular"
                                      ? "#F59E0B"
                                      : "#7C3AED",
                                  color: "#FFFFFF",
                                }}
                              >
                                {cardBadge}
                              </span>
                            )}

                            {/* Wishlist Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleWish(product.name);
                              }}
                              style={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                zIndex: 2,
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                fontSize: 13,
                                color: wish.includes(product.name) ? "#EF4444" : "#94A3B8",
                              }}
                              aria-label={`Save ${product.name}`}
                            >
                              {wish.includes(product.name) ? "♥" : "♡"}
                            </button>

                            {/* Product Image */}
                            <Link href={`/products/${product.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                              <div
                                style={{
                                  position: "relative",
                                  width: "100%",
                                  aspectRatio: "1/1",
                                  marginBottom: 10,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  style={{ maxWidth: "88%", maxHeight: "88%", objectFit: "contain" }}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src =
                                      "/images/reference/hero-immune-bottle.png";
                                  }}
                                />
                              </div>

                              {/* Brand & Titles */}
                              <span style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                                Queens Care
                              </span>
                              <h3
                                style={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: "#0F172A",
                                  margin: "3px 0 2px",
                                  lineHeight: 1.3,
                                }}
                              >
                                {product.name}
                              </h3>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "#64748B",
                                  margin: "0 0 10px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {product.note || product.category}
                              </p>
                            </Link>

                            {/* Price & Discount */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                              <b style={{ fontSize: 15, color: "#0F172A" }}>
                                ₹{product.price.toLocaleString("en-IN")}
                              </b>
                              <span style={{ fontSize: 11.5, color: "#94A3B8", textDecoration: "line-through" }}>
                                ₹{strikePrice}
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "#16A34A",
                                  background: "#DCFCE7",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                }}
                              >
                                {discountPct}% OFF
                              </span>
                            </div>

                            {/* Bottom Card Actions: Rating & Add to Bag */}
                            <div
                              style={{
                                marginTop: "auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingTop: 8,
                                borderTop: "1px solid #F1F5F9",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11.5, color: "#F59E0B", fontWeight: 700 }}>
                                <span>★</span>
                                <span style={{ color: "#1E293B" }}>{(product.rating || 4.8).toFixed(1)}</span>
                                <span style={{ color: "#94A3B8", fontSize: 10 }}>({product.reviewCount || 420})</span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  add(product);
                                }}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  background: "#1E1638",
                                  color: "#FFFFFF",
                                  border: "none",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  fontSize: 13,
                                  boxShadow: "0 2px 6px rgba(30,22,56,0.2)",
                                }}
                                aria-label={`Add ${product.name} to cart`}
                              >
                                🛒
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {collectionProducts.length === 0 && products.length > 0 && (
                      <p className="empty" style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
                        No results found. Try clearing filters or choosing another category.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        );
      }

      case "science": {
        const principles = ((c.principles as Array<Record<string, string>>) || [
          { number: "01", title: "Purposeful dosage", text: "Not marketing-magic ingredients." },
          { number: "02", title: "Radical clarity", text: "Every ingredient has a reason to be here." },
          { number: "03", title: "Better by design", text: "Elegant rituals, lower-impact choices." }
        ]).filter(p => p.title || p.text);
        return (
          <section className="science" id="science" key={sec.id ? String(sec.id) : `science-${idx}`} style={secStyle}>
            <div className="science-image">
              <Image
                src={String(c.imageUrl || "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=85")}
                alt="Laboratory researcher at work"
                fill
                sizes="(max-width: 650px) 100vw, 50vw"
              />
              <div className="stat-card">
                <b>{String(c.stat || "97")}<sup>%</sup></b>
                <span>{String(c.statText || "of customers feel a difference within 30 days*")}</span>
              </div>
            </div>
            <div className="science-copy">
              <p className="eyebrow">{String(c.eyebrow || "The Queens Care standard")}</p>
              <h2 style={headingStyle} dangerouslySetInnerHTML={{ __html: String(c.heading || "Precision you can feel. <em>Proof you can see.</em>") }} />
              <p>{String(c.description || "We bring pharmaceutical rigor to the products that live on your shelf. Each formula begins with a real need, is built around meaningful dosage, and is independently tested for purity.")}</p>
              <div className="principles">
                {principles.map((p, i) => (
                  <div key={i}>
                    <b>{p.number || `0${i + 1}`}</b>
                    <span><strong>{p.title}</strong>{p.text}</span>
                  </div>
                ))}
              </div>
              <Link className="button light" href={String(c.ctaLink || "/about")}>
                {String(c.ctaText || "Meet our standard")} <span>→</span>
              </Link>
            </div>
          </section>
        );
      }

      case "doctor": {
        const dc = c as Record<string, unknown>;
        return (
          <section key={sec.id ? String(sec.id) : `doctor-${idx}`} className="doctor-section" style={{ padding: "80px 24px", background: "linear-gradient(180deg, rgba(40,13,56,0.03) 0%, rgba(212,175,55,0.06) 100%)" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <DoctorCharacter
                enabled={dc.enabled !== false}
                position={(dc.position as "left" | "center" | "right") || "center"}
                size={(dc.size as "sm" | "md" | "lg") || "md"}
                animSpeed={Number(dc.animSpeed) || 1}
                greeting={String(dc.greeting || "Hi, I'm Dr. Queens!")}
                subtext={String(dc.subtext || "I help you find the right formulations for your wellness journey.")}
                ctaText={String(dc.ctaText || "Take the Quiz")}
                ctaLink={String(dc.ctaLink || "/recommendations")}
                bgStyle={(dc.bgStyle as "purple" | "gold" | "white" | "gradient" | "transparent") || "gradient"}
                mobileVisible={dc.mobileVisible !== false}
                lottieUrl={String(dc.lottieUrl || "")}
              />
            </div>
          </section>
        );
      }

      case "ritual": {
        const cards = ((c.cards as Array<Record<string, string>>) || [
          { number: "01", heading: "I want to feel<br/>more <em>energised.</em>", cta: "Discover energy care →", link: "#collection", color: "amber" },
          { number: "02", heading: "I want a calmer<br/><em>evening.</em>", cta: "Discover sleep care →", link: "#collection", color: "lavender" },
          { number: "03", heading: "I want to glow<br/>from <em>within.</em>", cta: "Discover dermal care →", link: "#collection", color: "rose" }
        ]).filter(card => card.heading);
        return (
          <section className="ritual section" key={sec.id ? String(sec.id) : `ritual-${idx}`} style={secStyle}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{String(c.eyebrow || "Build your ritual")}</p>
                <h2 style={headingStyle} dangerouslySetInnerHTML={{ __html: String(c.heading || "Care that meets you<br/><em>where you are.</em>") }} />
              </div>
              <p className="side-copy">{String(c.sideText || "Not sure where to begin? Let our guided care finder create a considered starting point in under two minutes.")}</p>
            </div>
            <div className="ritual-cards">
              {cards.map((card, i) => (
                <a
                  key={card.id || i}
                  href={card.link || "#collection"}
                  className={`ritual-card ${card.color || "amber"}`}
                  style={{
                    ...(card.bgColor ? { backgroundColor: card.bgColor } : {}),
                    ...(card.textColor ? { color: card.textColor } : {}),
                  }}
                >
                  <span>{card.number || `0${i + 1}`}</span>
                  <h3 dangerouslySetInnerHTML={{ __html: card.heading }} />
                  {card.description && <p style={{ fontSize: 13, opacity: 0.85, margin: "6px 0 12px" }}>{card.description}</p>}
                  <b>{card.cta || "Explore ritual →"}</b>
                </a>
              ))}
            </div>
          </section>
        );
      }

      case "testimonial": {
        const hasTestimonials = testimonials.length > 0;
        const currentQuote = hasTestimonials
          ? testimonials[testimonialIndex]?.body
          : (c.quote || "Every formulation released by Queens Care Laboratories adheres to rigorous active compound stability, strict batch release standards, and complete ingredient transparency.");
        const currentAuthor = hasTestimonials
          ? testimonials[testimonialIndex]?.name
          : (c.author || "Formulation & Quality Committee");
        const currentAttribution = hasTestimonials
          ? testimonials[testimonialIndex]?.title
          : (c.attribution || "Queens Care Laboratories · Scientific Standards");
        const count = testimonials.length;
        return (
          <section className="quote" key={sec.id ? String(sec.id) : `quote-${idx}`} style={secStyle}>
            <div className="quote-mark">&ldquo;</div>
            <blockquote>{currentQuote}</blockquote>
            <div>
              <b>{currentAuthor}</b>
              <span>{currentAttribution}</span>
              {!hasTestimonials && (
                <div style={{ marginTop: 8 }}>
                  <Link href="/trust" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>
                    Read our Trust &amp; Quality Standards →
                  </Link>
                </div>
              )}
            </div>
            {hasTestimonials && count > 1 && (
              <div className="quote-controls">
                <button
                  type="button"
                  aria-label="Previous testimonial"
                  onClick={() => setTestimonialIndex((i) => (i === 0 ? count - 1 : i - 1))}
                >
                  ←
                </button>
                <span>{String(testimonialIndex + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
                <button
                  type="button"
                  aria-label="Next testimonial"
                  onClick={() => setTestimonialIndex((i) => (i + 1) % count)}
                >
                  →
                </button>
              </div>
            )}
          </section>
        );
      }

      case "newsletter": {
        return (
          <section className="journal section" id="journal" key={sec.id ? String(sec.id) : `journal-${idx}`} style={secStyle}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{String(c.eyebrow || "The care journal")}</p>
                <h2 style={headingStyle} dangerouslySetInnerHTML={{ __html: String(c.heading || "Ideas, insights and<br/><em>everyday care.</em>") }} />
              </div>
              <Link href={String(c.ctaLink || "/blog")} className="text-link">
                {String(c.ctaText || "View all journal")} <span>→</span>
              </Link>
            </div>
            <div className="journal-grid">
              {blogPosts.slice(0, Number(c.postCount || 2)).map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <article style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ position: "relative", aspectRatio: "3/2", overflow: "hidden", marginBottom: 12, borderRadius: 4 }}>
                      <img
                        src={post.image || "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=80"}
                        alt={post.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=80"; }}
                      />
                    </div>
                    <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)" }}>
                      {(post.category || "Wellness Notes").toUpperCase()} {post.readTime ? `· ${post.readTime.toUpperCase()}` : ""}
                    </p>
                    <h3 style={{ font: "20px var(--font-display)", margin: "6px 0 10px", flex: 1 }}>{post.title}</h3>
                    <span style={{ fontSize: 13, color: "var(--purple)", fontWeight: 600 }}>Read story →</span>
                  </article>
                </Link>
              ))}
              {blogPosts.length === 0 && (
                <p style={{ gridColumn: "1 / span 2", color: "var(--muted)", padding: "30px 0" }}>
                  Dispatches from our laboratory are being prepared. <Link href="/blog" style={{ color: "var(--purple)" }}>Visit the journal</Link>
                </p>
              )}
              <article className="journal-cta">
                <span>THE<br/>CARE<br/>LETTER</span>
                <h3>{String(c.newsletterHeading || "A smarter kind of inbox.")}</h3>
                <p>{String(c.newsletterSubtitle || "Thoughtful dispatches on science, care, and living well.")}</p>
                <form onSubmit={subscribe}>
                  <input type="email" required aria-label="Your email address" placeholder="Your email address"/>
                  <button aria-label="Subscribe">→</button>
                </form>
              </article>
            </div>
          </section>
        );
      }

      case "affiliate": {
        const stats = ((c.stats as Array<Record<string, string>>) || [
          { value: "10%", label: "Commission" },
          { value: "30 Days", label: "Cookie Window" },
          { value: "Direct", label: "Monthly Payouts" }
        ]);
        return (
          <section className="section" key={sec.id ? String(sec.id) : `affiliate-${idx}`} style={{ background: c.backgroundColor ? String(c.backgroundColor) : "var(--paper)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "72px 0", ...secStyle }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 48, alignItems: "center" }}>
              <div>
                <p className="eyebrow" style={{ color: "var(--gold)" }}>{String(c.eyebrow || "PARTNERSHIP PROGRAMME")}</p>
                <h2 style={{ font: "clamp(28px, 4vw, 42px)/1.15 var(--font-display)", letterSpacing: "-.02em", margin: "12px 0 20px", ...headingStyle }}>
                  {String(c.heading || "Partner with Queens Care Laboratories")}
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--muted)", marginBottom: 28 }}>
                  {String(c.description || "Share science-backed formulations you believe in and earn through your personalized referral link.")}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 32 }}>
                  {stats.map((stat, i) => (
                    <div key={i} style={{ padding: "16px 14px", background: "#fff", border: "1px solid var(--line)" }}>
                      <b style={{ fontSize: 20, color: "var(--purple)", display: "block" }}>{stat.value}</b>
                      <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{stat.label}</span>
                    </div>
                  ))}
                </div>
                <Link href={String(c.ctaLink || "/affiliate")} className="button" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {String(c.ctaText || "BECOME AN AFFILIATE")} <span>→</span>
                </Link>
              </div>
              <div style={{ position: "relative", aspectRatio: "4/3", borderRadius: 4, overflow: "hidden", border: "1px solid var(--line)" }}>
                <img
                  src={String(c.imageUrl || "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=85")}
                  alt="Queens Care Laboratory Formulations"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=85"; }}
                />
              </div>
            </div>
          </section>
        );
      }

      case "consult": {
        return (
          <section className="consult" key={sec.id ? String(sec.id) : `consult-${idx}`} style={secStyle}>
            <div>
              <p className="eyebrow">{String(c.eyebrow || "Care, with a human on the other end")}</p>
              <h2 style={headingStyle} dangerouslySetInnerHTML={{ __html: String(c.heading || "Questions deserve<br/>thoughtful answers.") }} />
              <p>{String(c.description || "Our care team is here to help you make confident choices — no pressure, no jargon.")}</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href={String(c.ctaLink || "/contact")} className="button">
                  {String(c.ctaText || "Talk to our care team")} <span>→</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setQuizOpen(true)}
                  className="button"
                  style={{ background: "rgba(212,175,55,0.12)", color: "var(--purple)", border: "1.5px solid var(--gold)", cursor: "pointer", fontWeight: 700 }}
                >
                  ✦ Take Health Quiz <span>→</span>
                </button>
                {(c.secondaryCtaText || c.secondaryCtaLink) && (
                  <Link href={String(c.secondaryCtaLink || "/doctors")} className="button" style={{ background: "transparent", color: "var(--purple)", border: "1px solid var(--purple)" }}>
                    {String(c.secondaryCtaText || "For healthcare professionals")} <span>→</span>
                  </Link>
                )}
              </div>
            </div>
            <div className="consult-image">
              <img
                src={String(c.imageUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1000&q=85")}
                alt="Doctor speaking with a patient"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1000&q=85"; }}
              />
            </div>
          </section>
        );
      }

      case "quiz": {
        return (
          <section className="section" key={sec.id ? String(sec.id) : `quiz-${idx}`} style={{ background: "linear-gradient(180deg, rgba(40,13,56,0.03) 0%, rgba(212,175,55,0.06) 100%)", padding: "72px 0", ...secStyle }}>
            <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
              <p className="eyebrow" style={{ color: "var(--gold, #D4AF37)" }}>{String(c.eyebrow || "Personalized Consultation")}</p>
              <h2 style={{ font: "clamp(28px, 4vw, 42px)/1.15 var(--font-display)", color: "var(--purple, #2A0F3A)", margin: "12px 0 16px", ...headingStyle }} dangerouslySetInnerHTML={{ __html: String(c.heading || "Find the exact formulation your routine requires.") }} />
              <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--muted, #64748b)", maxWidth: 640, margin: "0 auto 28px" }}>
                {String(c.description || "Answer 4 clinical questions to calculate your personalized bioactive routine.")}
              </p>
              <button
                type="button"
                onClick={() => setQuizOpen(true)}
                className="button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 32px",
                  background: "var(--purple, #2A0F3A)",
                  color: "var(--gold, #D4AF37)",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <span>✦ {String(c.ctaText || "Take Formulation Quiz")}</span> <span>→</span>
              </button>
            </div>
          </section>
        );
      }

      case "custom":
      default: {
        return (
          <section key={sec.id ? String(sec.id) : `custom-${idx}`} className="section" style={{ padding: "72px 0", ...secStyle }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
              {c.eyebrow && <p className="eyebrow" style={{ color: "var(--gold)" }}>{String(c.eyebrow)}</p>}
              {c.heading && <h2 style={{ font: "clamp(28px, 4vw, 42px)/1.15 var(--font-display)", margin: "12px 0 20px", ...headingStyle }} dangerouslySetInnerHTML={{ __html: String(c.heading) }} />}
              {c.body && <div style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 24, whiteSpace: "pre-line" }} dangerouslySetInnerHTML={{ __html: String(c.body) }} />}
              {c.mediaUrl && (
                <div style={{ margin: "24px 0", borderRadius: 6, overflow: "hidden", border: "1px solid var(--line)" }}>
                  {c.mediaType === "video" ? (
                    <video src={String(c.mediaUrl)} controls autoPlay muted loop style={{ width: "100%", maxHeight: 500, objectFit: "cover" }} />
                  ) : (
                    <img src={String(c.mediaUrl)} alt={String(c.heading || "Queens Care")} style={{ width: "100%", maxHeight: 500, objectFit: "cover" }} />
                  )}
                </div>
              )}
              {c.ctaText && (
                <Link href={String(c.ctaLink || "#")} className="button" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {String(c.ctaText)} <span>→</span>
                </Link>
              )}
            </div>
          </section>
        );
      }
    }
  };

  const bannerSection = hpSections.find((s) => s.type === "banner");
  const isBannerVisible = bannerSection ? (bannerSection.active !== false && bannerSection.visible !== false) : true;
  const bannerContent = bannerSection
    ? (typeof bannerSection.content === "string" ? JSON.parse(bannerSection.content) : bannerSection.content || {})
    : getHpContent("banner");

  const marqueeSection = hpSections.find((s) => s.type === "marquee");
  const marqueeContent = marqueeSection
    ? (typeof marqueeSection.content === "string" ? JSON.parse(marqueeSection.content) : (marqueeSection.content as Record<string, unknown>) || {})
    : getHpContent("marquee");
  const marqueePlacement = String(marqueeContent.placement || "hero");
  const marqueeItems = Array.isArray(marqueeContent.items) && marqueeContent.items.length > 0
    ? (marqueeContent.items as string[])
    : ["Clinical intelligence", "Made with soul", "Science-backed formulas", "Traceable ingredients", "Designed with doctors", "Pharmaceutical rigor", "Everyday wellness"];
  const marqueeSpeed = Number(marqueeContent.speed) || 24;
  const marqueeSeparator = String(marqueeContent.separator || "✦");
  const isMarqueeActive = marqueeSection ? (marqueeSection.active !== false && marqueeSection.visible !== false) : true;

  return (
    <div className="site-shell">
      {isBannerVisible && (
        <div
          className="announcement"
          style={{
            ...(bannerContent.backgroundColor ? { backgroundColor: String(bannerContent.backgroundColor) } : {}),
            ...(bannerContent.textColor ? { color: String(bannerContent.textColor) } : {}),
          }}
        >
          <span>{bannerContent.text || "Complimentary delivery on orders above ₹1,500"}</span>
          <DeliveryTimer />
          <Link href={bannerContent.secondaryLink || "/doctors"}>
            {bannerContent.secondaryText || "For healthcare professionals"} →
          </Link>
        </div>
      )}

      {/* Universal Marquee — Above Header Placement */}
      {isMarqueeActive && marqueePlacement === "above_header" && (
        <UniversalMarquee
          items={marqueeItems}
          speed={marqueeSpeed}
          separator={marqueeSeparator}
          currentPlacement="above_header"
          placement="above_header"
        />
      )}

      <header className="nav-wrap">
        <Link href="/" className="brand" aria-label="Queens Care home">
          {logoUrl && !logoFailed ? (
            <img src={logoUrl} alt="Queens Care" style={{ height: logoHeight, maxWidth: logoMaxWidth, objectFit: "contain" }} onError={() => {
              if (logoRetryCount < 2) {
                // Retry after a short delay — the server may have been slow
                setTimeout(() => { setLogoRetryCount(c => c + 1); setLogoFailed(false); }, 2000);
              } else {
                setLogoFailed(true);
              }
            }} />
          ) : (
            <i>Q</i>
          )}
          <span>QUEENS<br/><b>CARE</b></span>
        </Link>
        <nav className={menu ? "open" : ""}>
          {(headerNav.length > 0 ? headerNav.filter(n => n.visible !== false).sort((a,b) => (a.sort ?? 0) - (b.sort ?? 0)) : [
            { label: "Shop", href: "/#collection" },
            { label: "About", href: "/about" },
            { label: "Our science", href: "/#science" },
            { label: "Blog", href: "/blog" },
            ...(isEmployeeVisibleInHeader ? [{ label: "Our team", href: "/employee" }] : []),
            { label: "Contact", href: "/contact" }
          ]).map((item) => {
            const isExternal = item.href.startsWith("http");
            if (isExternal) return <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">{item.label}</a>;
            if (item.href.startsWith("#")) return <a key={item.label} href={item.href}>{item.label}</a>;
            return <Link key={item.label} href={item.href}>{item.label}</Link>;
          })}
        </nav>
        <div className="nav-actions">
          <Link href="/account" style={{ fontSize: 12, textDecoration: "none", color: "var(--ink)", marginRight: 8, display: "flex", alignItems: "center", gap: 4 }} aria-label="Account">
            {user ? <span title={user.email}>Account</span> : <span>Sign In</span>}
          </Link>
          <button
            className="search"
            onClick={() => {
              setStartVoiceSearch(false);
              setSearchOpen(true);
            }}
            style={{ display: "flex", alignItems: "center", gap: 5, border: "none", borderBottom: "1px solid var(--line)", padding: "5px 0", background: "none", cursor: "pointer", fontSize: 12 }}
            aria-label="Open search"
          >
            <Icon>⌕</Icon>
            <span style={{ color: "var(--muted)" }}>Search</span>
          </button>
          <button
            type="button"
            className="voice-search-btn"
            onClick={() => {
              setStartVoiceSearch(true);
              setSearchOpen(true);
            }}
            aria-label="Search formulations with voice"
            title="Voice Search"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(42,15,58,0.12)",
              background: "rgba(42,15,58,0.04)",
              color: "var(--purple, #2A0F3A)",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 14,
              fontSize: 11,
              fontWeight: 600,
              gap: 4,
              transition: "all 0.15s",
            }}
          >
            <span aria-hidden="true">🎙️</span>
            <span>Voice</span>
          </button>
          <SearchOverlay
            open={searchOpen}
            startVoiceOnOpen={startVoiceSearch}
            onClose={() => {
              setSearchOpen(false);
              setStartVoiceSearch(false);
            }}
          />
          <button className="icon-button" onClick={() => setNotice(wish.length ? `${wish.length} saved product${wish.length > 1 ? "s" : ""}.` : "Your saved list is waiting for its first ritual.")} aria-label="View wishlist">
            ♡<em>{wish.length || ""}</em>
          </button>
          <CartBadge />
          <button className="bag-dummy" onClick={() => setNotice(cartCount ? `${cartCount} item${cartCount > 1 ? "s" : ""} in your care bag — checkout is ready.` : "Your care bag is empty.")}>
            Bag <b>{cartCount}</b>
          </button>
          <button className="menu" onClick={() => setMenu(!menu)} aria-label="Toggle navigation">
            ☰
          </button>
        </div>
      </header>

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

      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
      <main>
        {/* Scroll-linked colour stage — Veridia-style background morph */}
        <div className="stage-bg" aria-hidden="true" />
        <CareScene />
        {sortedSections.map((sec, idx) => renderSection(sec, idx))}

        {/* Universal Marquee — Hero or Between Sections Placement */}
        {isMarqueeActive && (marqueePlacement === "hero" || marqueePlacement === "between_sections" || marqueePlacement === "all") && (
          <UniversalMarquee
            items={marqueeItems}
            speed={marqueeSpeed}
            separator={marqueeSeparator}
            currentPlacement={marqueePlacement as "hero" | "between_sections"}
            placement={marqueePlacement as "hero" | "between_sections" | "all"}
          />
        )}
      </main>

      {/* Universal Marquee — Above Footer Placement */}
      {isMarqueeActive && marqueePlacement === "above_footer" && (
        <UniversalMarquee
          items={marqueeItems}
          speed={marqueeSpeed}
          separator={marqueeSeparator}
          currentPlacement="above_footer"
          placement="above_footer"
        />
      )}
      <footer
        style={{
          ...(footerSettings.bg ? { backgroundColor: footerSettings.bg } : {}),
          ...(footerSettings.textColor ? { color: footerSettings.textColor } : {}),
        }}
      >
        <div className="footer-top">
          <Link href="/" className="brand inverse">
            {logoUrl && !logoFailed ? (
              <img src={logoUrl} alt="Queens Care" style={{ height: logoHeight, maxWidth: logoMaxWidth, objectFit: "contain" }} onError={() => {
                if (logoRetryCount < 2) {
                  setTimeout(() => { setLogoRetryCount(c => c + 1); setLogoFailed(false); }, 2000);
                } else {
                  setLogoFailed(true);
                }
              }} />
            ) : (
              <i>Q</i>
            )}
            <span>QUEENS<br/><b>CARE</b></span>
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
      <div className="footer-bottom">
        <span>© 2026 Queens Care Laboratories. All rights reserved.</span>
        {socialLinks && socialLinks.length > 0 && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {socialLinks.map((link) => {
              const size = Number(link.desktopIconSize || link.iconSize || 20);
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target={link.openNewTab !== false ? "_blank" : undefined}
                  rel={link.openNewTab !== false ? "noopener noreferrer" : undefined}
                  title={link.label}
                  aria-label={link.label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: size + 10,
                    height: size + 10,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(212,175,55,0.2)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "#D4AF37";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.12)";
                  }}
                >
                  <SocialBrandIcon
                    platform={link.platform}
                    size={size}
                    customIconUrl={link.customIconUrl}
                    color="#ffffff"
                  />
                </a>
              );
            })}
          </div>
        )}
        <span>India · English</span>
        <span>Queens Care Laboratories · India</span>
      </div>
      </footer>
      <HealthQuizModal isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
    </div>
  );
}