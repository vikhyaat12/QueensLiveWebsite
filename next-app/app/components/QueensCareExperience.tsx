/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getCartCount, subscribeCart } from "@/lib/client-cart";
import UniversalMarquee from "./UniversalMarquee";
import HealthQuizModal from "./HealthQuizModal";
import QueensCareHeader from "./QueensCareHeader";
import QueensCareFooter from "./QueensCareFooter";
import WhatsAppConnect from "./WhatsAppConnect";
import SectionRenderer from "./homepage/SectionRenderer";
import UniversalPromoRenderer from "./promotions/UniversalPromoRenderer";
import type { HomeShared, Product, BlogPostItem } from "./homepage/shared";
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
        const HD_PRODUCT_ASSETS: Record<string, string> = {
          "immune-care-plus": "/images/products-hd/prod-immune-care-hd.webp",
          "womens-vitality": "/images/products-hd/prod-womens-vitality-hd.webp",
          "respiracare": "/images/products-hd/prod-respiracare-hd.webp",
          "digestive-balance": "/images/products-hd/prod-digestive-balance-hd.webp",
          "skinglow-plus": "/images/products-hd/prod-skinglow-hd.webp",
          "bone-strength": "/images/products-hd/prod-bone-strength-hd.webp",
          "heart-care": "/images/products-hd/prod-heart-care-hd.webp",
          "kids-immunity": "/images/products-hd/prod-kids-immunity-hd.webp",
          "liko-q-suspension": "/images/hero/likoq-original-bottle.png",
        };

        // Honor Admin visibility controls: homepageVisible=false / visible=false hides a product from the homepage
        const productList = ((data.products || []) as Product[]).filter(
          (p) => p.homepageVisible !== false && p.visible !== false
        );
        const seenNames = new Set<string>();
        const uniqueProducts: Product[] = [];

        for (const p of productList) {
          const norm = p.name.trim().toLowerCase();
          if (norm.includes("liko q") && seenNames.has("liko q")) continue;
          if (norm.includes("liko q")) seenNames.add("liko q");
          else if (seenNames.has(norm)) continue;
          else seenNames.add(norm);
          uniqueProducts.push(p);
        }

        const mappedProducts = uniqueProducts.map((p) => {
          const hdImg = HD_PRODUCT_ASSETS[p.slug] || "";
          return {
            ...p,
            image: hdImg || p.image || (p as Record<string, unknown>).thumbnail as string || "/images/products-hd/prod-immune-care-hd.webp",
            note: p.description ? (p.description.split(".")[0] || p.description) : "",
            tag: p.bestSeller ? "Bestseller" : (p.newArrival ? "New" : (p.featured ? "Featured" : (p.rating && p.rating >= 4.8 ? "Popular" : "New"))),
          };
        });
        setProducts(mappedProducts);
        const cats = [...new Set(uniqueProducts.map((p) => p.category).filter(Boolean))];
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
      { id: "hs-collection", type: "collection" },
      { id: "hs-science", type: "science" },
      { id: "hs-trust", type: "trust" },
      { id: "hs-ritual", type: "ritual" },
      { id: "hs-consult", type: "consult" },
      { id: "hs-faq", type: "faq" },
      { id: "hs-newsletter", type: "newsletter" },
    ];
    if (!hpSections.length) return defaultSections;

    const list = [...hpSections]
      .filter((s) => s.active !== false && s.visible !== false && s.type !== "banner")
      .sort((a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0));

    // Ensure clinical objection-handling FAQ is present
    if (!list.some((s) => s.type === "faq")) {
      const newsIdx = list.findIndex((s) => s.type === "newsletter");
      const faqSec = { id: "hs-faq", type: "faq", title: "Clinical FAQs", active: true, visible: true, sort: 7.5 };
      if (newsIdx >= 0) {
        list.splice(newsIdx, 0, faqSec);
      } else {
        list.push(faqSec);
      }
    }

    return list.length > 0 ? list : defaultSections;
  }, [hpSections]);

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
  const shared: HomeShared = {
    loading, products, search, setSearch, shown, wish, toggleWish, add, setQuizOpen,
    testimonials, testimonialIndex, setTestimonialIndex, subscribe, getHpContent, blogPosts,
    logoUrl, logoFailed, logoHeight, logoMaxWidth, logoRetryCount, setLogoRetryCount, setLogoFailed,
    menu, setMenu, headerNav,
    searchOpen, setSearchOpen, startVoiceSearch, setStartVoiceSearch, setNotice, cartCount, user,
    footerSettings, footerLinks, socialLinks,
  };

  return (
    <div className="site-shell">
      <QueensCareHeader activePage="home" />

      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
      <main id="main-content">
        {/* Scroll-linked colour stage */}
        <div className="stage-bg" aria-hidden="true" />

        {sortedSections.map((sec, idx) => (
          <SectionRenderer
            key={sec.id ? String(sec.id) : `section-${idx}`}
            sec={sec}
            idx={idx}
            shared={shared}
          />
        ))}
      </main>

      <QueensCareFooter />
      <WhatsAppConnect />

      <HealthQuizModal isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
        title="Scroll to top"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: "#6366F1",
          color: "#FFFFFF",
          border: "none",
          boxShadow: "0 4px 14px rgba(99, 102, 241, 0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 40,
          transition: "transform 0.2s ease, background 0.2s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
    </div>
  );
}

