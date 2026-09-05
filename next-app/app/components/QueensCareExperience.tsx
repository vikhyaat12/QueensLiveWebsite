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
          <section className="hero" key={sec.id ? String(sec.id) : `hero-${idx}`} style={{ ...(heroBg ? { background: String(heroBg) } : {}), ...secStyle }}>
            <div className="hero-copy">
              <p className="eyebrow" style={{ ...(c.textColor ? { color: String(c.textColor) } : {}) }}>
                {String(c.eyebrow || "A higher standard of everyday care")}
              </p>
              <h1
                style={{ ...(c.headingColor ? { color: String(c.headingColor) } : {}) }}
                dangerouslySetInnerHTML={{ __html: String(c.heading || "Science, made <em>personal.</em>") }}
              />
              <p className="lead" style={{ ...(c.textColor ? { color: String(c.textColor) } : {}), ...bodyStyle }}>
                {String(c.subtitle || "Intelligent formulations that turn your daily health rituals into small, powerful acts of self-respect.")}
              </p>
              <div className="hero-ctas" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <a
                  href={String(c.ctaLink || "#collection")}
                  className="button"
                  style={btnStyle}
                >
                  {String(c.ctaText || "Explore the collection")} <span>→</span>
                </a>
                <button
                  type="button"
                  onClick={() => setQuizOpen(true)}
                  className="button secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(212,175,55,0.12)",
                    color: "var(--purple, #2A0F3A)",
                    border: "1.5px solid var(--gold, #D4AF37)",
                    borderRadius: btnStyle.borderRadius || 4,
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <span>✦ Take Health Quiz</span>
                </button>
                <a
                  href={String(c.secondaryLink || "#science")}
                  className="text-link"
                  style={{ ...(c.textColor ? { color: String(c.textColor) } : {}) }}
                >
                  {String(c.secondaryText || "How we formulate")} <span>↗</span>
                </a>
              </div>
              <div className="ratings" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {c.rating && c.ratingCount ? (
                  <>
                    <div className="avatars" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "var(--gold)", background: "rgba(212,175,55,0.12)", padding: "4px 8px", borderRadius: 4, border: "1px solid rgba(212,175,55,0.3)" }}>
                      ★ VERIFIED
                    </div>
                    <p style={{ margin: 0 }}><b>{String(c.rating)}</b> {String(c.ratingCount)}</p>
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)" }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#2e7d32" }} />
                    <span style={{ fontWeight: 600, letterSpacing: "0.02em" }}>{String(c.trustHeadline || "Direct Cold-Chain Distribution")}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ color: "var(--muted)" }}>{String(c.trustSubline || "Batch Purity Tested")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cinematic Hero Visual Stage */}
            <div
              className="hero-cinematic-stage-wrap"
              style={{
                position: "relative",
                width: "100%",
                maxWidth: c.characterPosition === "split" || !c.characterPosition ? 680 : 460,
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                flexWrap: "wrap",
              }}
            >
              {heroImage ? (
                <div style={{ width: "100%", maxWidth: 460, borderRadius: 12, overflow: "hidden" }}>
                  <img
                    src={String(heroImage)}
                    alt={String(c.heading || "Hero")}
                    style={{ width: "100%", height: 480, objectFit: "cover" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=85"; }}
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
                        maxWidth: c.characterPosition === "character_only" ? 380 : 280,
                        position: "relative",
                        zIndex: 3,
                      }}
                    >
                      <FemaleDoctorHeroVisual
                        enabled={true}
                        position={(c.characterPosition as "split" | "left" | "right" | "center") || "split"}
                        size={(c.characterSize as "sm" | "md" | "lg") || "md"}
                        animSpeed={Number(c.characterAnimSpeed || 1)}
                        greeting={String(c.characterGreeting || "Hello, I'm Dr. Queens")}
                        subtext={String(c.characterSubtext || "Let me guide your personalized formulation ritual")}
                        badgeText={String(c.characterBadge || "Clinical Specialist")}
                        customImageUrl={String(c.characterImageUrl || "")}
                        animationStyle={(c.characterAnimation as "gentle_breathing" | "consultation" | "minimal" | "none") || "gentle_breathing"}
                        showSpeechBubble={c.characterBubble !== false}
                        onOpenQuiz={() => setQuizOpen(true)}
                      />
                    </div>
                  )}

                  {/* 3D Bioactive Product Visualizer */}
                  {heroVis.enabled !== false && c.characterPosition !== "character_only" && (
                    <div
                      className="hero-product-col"
                      style={{
                        flex: c.characterPosition === "product_only" ? "1 1 420px" : "1 1 280px",
                        maxWidth: c.characterPosition === "product_only" ? 460 : 380,
                        position: "relative",
                        zIndex: 2,
                      }}
                    >
                      <Hero3DProductVisual
                        productName={String(heroVis.productName || "LUMINE-C™")}
                        subtitle={String(heroVis.subtitle || "Radiance serum")}
                        verticalLabel={String(heroVis.verticalLabel || "FORMULATED WITH INTENTION")}
                        scale={Number(heroVis.scale || 0.95)}
                        autoRotate={heroVis.autoRotate !== false}
                        rotationSpeed={Number(heroVis.rotationSpeed || 1.0)}
                        mouseInteraction={heroVis.mouseInteraction !== false}
                        lightingIntensity={Number(heroVis.lightingIntensity || 1.5)}
                        accentColor={String(heroVis.accentColor || "#D4AF37")}
                        bgEffect={(heroVis.bgEffect as "studio" | "purple" | "transparent") || "transparent"}
                        customImageUrl={String(heroVis.customImageUrl || "")}
                        customModelUrl={String(heroVis.customModelUrl || "")}
                        height={460}
                      />
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
        const selectedIds: string[] = Array.isArray(c.selectedProductIds) ? c.selectedProductIds as string[] : [];
        const catFilter: string[] = Array.isArray(c.selectedCategoryFilter) ? c.selectedCategoryFilter as string[] : [];
        const collectionProducts = (() => {
          if (selectedIds.length > 0) {
            const idSet = new Set(selectedIds);
            return products.filter(p => idSet.has(p.id));
          }
          if (catFilter.length > 0) {
            const catSet = new Set(catFilter);
            return products.filter(p => catSet.has(p.category));
          }
          return shown;
        })();
        return (
          <section className="collection section" id="collection" key={sec.id ? String(sec.id) : `collection-${idx}`} style={secStyle}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{String(c.eyebrow || "The care edit")}</p>
                <h2 style={headingStyle} dangerouslySetInnerHTML={{ __html: String(c.heading || "Considered essentials<br/>for your <em>whole self.</em>") }} />
              </div>
              <a href="#collection" className="text-link">{String(c.ctaText || "Shop all care")} <span>→</span></a>
            </div>
            <div className="category-row">
              {categories.map((cat, index) => (
                <button key={cat} onClick={() => setSearch(cat)}>
                  <span>0{index + 1}</span>{cat}<b>→</b>
                </button>
              ))}
            </div>
            {loading ? (
              <p style={{ marginTop: 40, color: "var(--muted)", textAlign: "center" }}>Loading collection…</p>
            ) : (
              <>
                <div className="product-grid">
                  {collectionProducts.map((product) => (
                    <Link href={`/products/${product.slug}`} key={product.id} style={{ textDecoration: "none", color: "inherit" }}>
                      <article className="product">
                        <div className="product-image">
                          <Image src={product.image} alt={product.name} fill sizes="(max-width: 650px) 50vw, 25vw"/>
                          <span className="pill">{product.tag}</span>
                          <button className="heart" onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); toggleWish(product.name); }} aria-label={`Save ${product.name}`}>
                            {wish.includes(product.name) ? "♥" : "♡"}
                          </button>
                          <button className="quick-add" onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); add(product); }}>
                            Add to bag
                          </button>
                        </div>
                        <p>{product.category}</p>
                        <h3>{product.name}</h3>
                        <small>{product.note}</small>
                        <div className="price">
                          <b>₹{product.price.toLocaleString("en-IN")}</b>
                          <span>★★★★★</span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
                {collectionProducts.length === 0 && products.length > 0 && (
                  <p className="empty">No results yet. Try &ldquo;wellness&rdquo; or choose a care category above.</p>
                )}
              </>
            )}
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
          <button className="search" onClick={() => setSearchOpen(true)} style={{ display: "flex", alignItems: "center", gap: 5, border: "none", borderBottom: "1px solid var(--line)", padding: "5px 0", background: "none", cursor: "pointer", fontSize: 12 }} aria-label="Open search">
            <Icon>⌕</Icon>
            <span style={{ color: "var(--muted)" }}>Search</span>
          </button>
          <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
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
        {/* Doctor Character Section */}
        <div data-testid="doctor-debug" style={{padding:'40px',textAlign:'center',background:'linear-gradient(180deg, rgba(40,13,56,0.03) 0%, rgba(212,175,55,0.06) 100%)'}}>
          <DoctorCharacter
            greeting="Hi, I'm Dr. Queens!"
            subtext="I help you find the right formulations for your wellness journey."
            ctaText="Take the Quiz"
            ctaLink="/recommendations"
            position="center"
            size="md"
            bgStyle="gradient"
          />
        </div>
        {/* Premium marquee ticker */}
        <Marquee items={["Clinical intelligence", "Made with soul", "Science-backed formulas", "Traceable ingredients", "Designed with doctors", "Pharmaceutical rigor", "Everyday wellness"]} separator="✦" speed={24} />
      </main>
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
    </div>
  );
}