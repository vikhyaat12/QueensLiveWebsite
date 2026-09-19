"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { addToCart } from "@/lib/client-cart";
import { sanitizeHtml } from "@/lib/sanitize";

export type PopupButton = {
  id: string;
  text: string;
  actionType: "link" | "product" | "category" | "blog" | "whatsapp" | "phone" | "email" | "add_to_cart" | "view_product" | "buy_now" | "close";
  url?: string;
  productId?: string;
  productSlug?: string;
  style: "primary" | "secondary" | "outline" | "ghost" | "custom";
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
  icon?: string;
  iconPosition?: "left" | "right";
  isFullWidth?: boolean;
};

export type PopupPlacement =
  | "site-wide"
  | "homepage"
  | "shop"
  | "product"
  | "specific_product"
  | "category"
  | "blog"
  | "specific_blog"
  | "about"
  | "science"
  | "contact"
  | "account"
  | "b2b"
  | "doctors"
  | "affiliate"
  | "employee"
  | "custom";

export type PopupPosition =
  | "center"
  | "top"
  | "bottom"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "custom";

export type Popup = {
  id: string;
  title: string;
  enabled: boolean;
  visible: boolean;

  // Placement & Position
  placement: PopupPlacement;
  targetProductSlug?: string;
  targetCategorySlug?: string;
  targetBlogSlug?: string;
  targetCustomPath?: string;
  position: PopupPosition;
  customPositionTop?: string;
  customPositionLeft?: string;
  customPositionBottom?: string;
  customPositionRight?: string;

  // Size
  sizePreset: "small" | "medium" | "large" | "fullscreen" | "custom";
  width: number;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
  mobileWidth?: string;
  mobileHeight?: string;
  padding?: number;
  margin?: number;
  borderRadius: number;

  // Media
  mediaType: "none" | "image" | "video";
  imageUrl: string;
  videoUrl?: string;
  videoPosterUrl?: string;
  videoAutoplay?: boolean;
  videoMuted?: boolean;
  videoLoop?: boolean;
  videoControls?: boolean;
  videoPlayOnClick?: boolean;
  mediaLayout: "above" | "beside_left" | "beside_right" | "below" | "media_only" | "background";
  mediaClickAction?: "none" | "link" | "product" | "whatsapp" | "phone" | "email";
  mediaClickUrl?: string;

  // Content
  eyebrow?: string;
  heading: string;
  subtitle?: string;
  text: string;
  highlightText?: string;
  bulletList?: string[];
  badgeText?: string;
  divider?: boolean;

  // Product Aware
  productAware?: boolean;
  productId?: string;
  productSlug?: string;
  showProductPrice?: boolean;
  showProductStock?: boolean;
  showProductImage?: boolean;

  // Buttons
  buttons: PopupButton[];
  buttonText?: string;
  buttonUrl?: string;

  // Triggers & Frequency
  trigger: "immediate" | "delay" | "scroll_percentage" | "scroll_element" | "exit_intent" | "click_selector";
  delay: number;
  scrollPercentage?: number;
  scrollElementSelector?: string;
  clickSelector?: string;

  frequency: "every_visit" | "once_per_session" | "once_per_day" | "once_per_x_days" | "once_ever";
  frequencyDays?: number;
  maxImpressions?: number;
  startDate?: string;
  endDate?: string;

  // Targeting
  deviceTarget: "all" | "desktop" | "tablet" | "mobile" | "mobile_tablet" | "desktop_tablet";
  desktopOnly?: boolean;

  // Design
  bgType?: "solid" | "gradient" | "image" | "transparent";
  bgColor?: string;
  bgGradient?: string;
  bgImageUrl?: string;
  textColor?: string;
  headingColor?: string;
  accentColor?: string;
  borderColor?: string;
  borderWidth?: number;
  shadowEnabled?: boolean;
  shadowBlur?: number;
  shadowColor?: string;

  // Overlay
  overlayEnabled?: boolean;
  overlayColor?: string;
  overlayOpacity: number;
  overlayBlur?: number;
  closeOnOverlayClick?: boolean;

  // Close Button
  showCloseButton?: boolean;
  closeButtonPosition?: "inside_right" | "inside_left" | "outside_right" | "outside_left";
  closeButtonColor?: string;
  closeButtonBg?: string;
  closeOnEscape?: boolean;

  // Typography
  headingSize?: number;
  bodySize?: number;
  fontAlignment?: "left" | "center" | "right";

  // Animation
  animation: string;
  animationDuration?: number;

  impressions?: number;
  clicks?: number;
  closes?: number;
  sort?: number;
};

// Helper: Check if video URL is YouTube or Vimeo embed
function getVideoEmbed(url: string, autoplay = false, muted = true, loop = false) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      isIframe: true,
      src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}&playlist=${id}&controls=1&modestbranding=1`,
    };
  }
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    return {
      isIframe: true,
      src: `https://player.vimeo.com/video/${id}?autoplay=${autoplay ? 1 : 0}&muted=${muted ? 1 : 0}&loop=${loop ? 1 : 0}`,
    };
  }
  return { isIframe: false, src: url };
}

export default function SitePopup() {
  const pathname = usePathname();
  const router = useRouter();

  const [popup, setPopup] = useState<Popup | null>(null);
  const [productData, setProductData] = useState<Record<string, unknown> | null>(null);
  const [visible, setVisible] = useState(false);
  const [cartToast, setCartToast] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);
  const hasLoggedImpression = useRef(false);

  // Track event helper
  const trackAction = useCallback((id: string, action: "impression" | "click" | "close") => {
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ id, action })], { type: "application/json" });
        navigator.sendBeacon("/api/popups/track", blob);
      } else {
        fetch("/api/popups/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  }, []);

  // Check frequency rules
  const checkFrequency = useCallback((p: Popup): boolean => {
    if (typeof window === "undefined") return false;
    try {
      const now = Date.now();
      const id = p.id;

      // Check max impressions
      if (p.maxImpressions && p.maxImpressions > 0) {
        const count = parseInt(localStorage.getItem(`qc_popup_imp_${id}`) || "0", 10);
        if (count >= p.maxImpressions) return false;
      }

      switch (p.frequency) {
        case "once_per_session":
          return sessionStorage.getItem(`qc_popup_sess_${id}`) !== "1";
        case "once_per_day": {
          const last = parseInt(localStorage.getItem(`qc_popup_day_${id}`) || "0", 10);
          return now - last > 24 * 60 * 60 * 1000;
        }
        case "once_per_x_days": {
          const days = p.frequencyDays || 7;
          const last = parseInt(localStorage.getItem(`qc_popup_xdays_${id}`) || "0", 10);
          return now - last > days * 24 * 60 * 60 * 1000;
        }
        case "once_ever":
          return localStorage.getItem(`qc_popup_ever_${id}`) !== "1";
        case "every_visit":
        default:
          return true;
      }
    } catch {
      return true;
    }
  }, []);

  // Record impression
  const recordImpression = useCallback((p: Popup) => {
    if (typeof window === "undefined") return;
    try {
      const id = p.id;
      const now = Date.now().toString();

      // Update frequency tracking
      sessionStorage.setItem(`qc_popup_sess_${id}`, "1");
      localStorage.setItem(`qc_popup_day_${id}`, now);
      localStorage.setItem(`qc_popup_xdays_${id}`, now);
      localStorage.setItem(`qc_popup_ever_${id}`, "1");

      const count = parseInt(localStorage.getItem(`qc_popup_imp_${id}`) || "0", 10) + 1;
      localStorage.setItem(`qc_popup_imp_${id}`, count.toString());

      if (!hasLoggedImpression.current) {
        hasLoggedImpression.current = true;
        trackAction(id, "impression");
      }
    } catch {}
  }, [trackAction]);

  // Dismiss popup
  const dismiss = useCallback(() => {
    if (!popup) return;
    setVisible(false);
    trackAction(popup.id, "close");
  }, [popup, trackAction]);

  // Handle escape key
  useEffect(() => {
    if (!visible || !popup?.closeOnEscape) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, popup?.closeOnEscape, dismiss]);

  // Placement matching
  const matchPlacement = useCallback((p: Popup, currentPath: string): boolean => {
    const path = currentPath.toLowerCase();

    switch (p.placement) {
      case "site-wide":
        return true;
      case "homepage":
        return path === "/" || path === "";
      case "shop":
        return path === "/shop" || path.startsWith("/shop/");
      case "product":
        return path.startsWith("/products/");
      case "specific_product": {
        const target = (p.targetProductSlug || "").trim().toLowerCase();
        if (!target) return false;
        return path === `/products/${target}` || path === `/products/${target}/` || (target.startsWith("lumine-c") && path.startsWith("/products/lumine-c"));
      }
      case "category": {
        const cat = (p.targetCategorySlug || "").trim().toLowerCase();
        if (!cat) return false;
        return path === `/categories/${cat}` || path.startsWith(`/categories/${cat}/`);
      }
      case "blog":
        return path === "/blog" || path.startsWith("/blog/");
      case "specific_blog": {
        const post = (p.targetBlogSlug || "").trim().toLowerCase();
        if (!post) return false;
        return path === `/blog/${post}` || path === `/blog/${post}/`;
      }
      case "about":
        return path === "/about" || path.startsWith("/about/");
      case "science":
        return path === "/science" || path.startsWith("/science/") || path === "/research-development" || path === "/quality-assurance";
      case "contact":
        return path === "/contact" || path.startsWith("/contact/");
      case "account":
        return path === "/account" || path.startsWith("/account/");
      case "b2b":
        return path === "/b2b" || path.startsWith("/b2b/");
      case "doctors":
        return path === "/doctors" || path.startsWith("/doctors/");
      case "affiliate":
        return path === "/affiliate" || path.startsWith("/affiliate/");
      case "employee":
        return path === "/employee" || path.startsWith("/employee/");
      case "custom": {
        const custom = (p.targetCustomPath || "").trim().toLowerCase();
        if (!custom) return false;
        return path === custom || path === `/${custom.replace(/^\//, "")}` || path.startsWith(custom);
      }
      default:
        return true;
    }
  }, []);

  // Device matching
  const matchDevice = useCallback((p: Popup): boolean => {
    if (typeof window === "undefined") return true;
    const width = window.innerWidth;
    const target = p.deviceTarget || (p.desktopOnly ? "desktop" : "all");

    switch (target) {
      case "desktop":
        return width >= 1024;
      case "tablet":
        return width >= 768 && width < 1024;
      case "mobile":
        return width < 768;
      case "mobile_tablet":
        return width < 1024;
      case "desktop_tablet":
        return width >= 768;
      case "all":
      default:
        return true;
    }
  }, []);

  // Main loader and trigger evaluator
  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    let cancelled = false;
    let cleanupTrigger: (() => void) | null = null;
    hasLoggedImpression.current = false;

    async function evaluatePopups() {
      try {
        const res = await fetch("/api/popups");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const popups: Popup[] = data.popups || [];
        if (popups.length === 0) return;

        // Find first matching popup
        const currentPath = pathname || "/";
        const matched = popups.find(
          (p) => matchPlacement(p, currentPath) && matchDevice(p) && checkFrequency(p)
        );

        if (!matched || cancelled) return;

        setPopup(matched);

        // Fetch live product details if product-aware
        const refProductSlug = matched.productSlug || (matched.placement === "specific_product" ? matched.targetProductSlug : "");
        if (matched.productAware || refProductSlug) {
          try {
            const pRes = await fetch(`/api/products/${refProductSlug}`);
            if (pRes.ok) {
              const pData = await pRes.json();
              if (pData.product && !cancelled) {
                setProductData(pData.product);
              }
            }
          } catch {}
        }

        // Apply trigger
        const trigger = matched.trigger || "delay";

        const activate = () => {
          if (cancelled) return;
          setVisible(true);
          recordImpression(matched);
        };

        if (trigger === "immediate") {
          activate();
        } else if (trigger === "delay") {
          const timer = setTimeout(activate, (matched.delay || 3) * 1000);
          cleanupTrigger = () => clearTimeout(timer);
        } else if (trigger === "exit_intent") {
          const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 10 && !cancelled) {
              activate();
              document.removeEventListener("mouseleave", handleMouseLeave);
            }
          };
          document.addEventListener("mouseleave", handleMouseLeave);
          cleanupTrigger = () => document.removeEventListener("mouseleave", handleMouseLeave);
        } else if (trigger === "scroll_percentage") {
          const targetPct = matched.scrollPercentage || 50;
          const handleScroll = () => {
            const scrollTotal = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollTotal <= 0) return;
            const currentPct = (window.scrollY / scrollTotal) * 100;
            if (currentPct >= targetPct && !cancelled) {
              activate();
              window.removeEventListener("scroll", handleScroll);
            }
          };
          window.addEventListener("scroll", handleScroll, { passive: true });
          cleanupTrigger = () => window.removeEventListener("scroll", handleScroll);
        } else if (trigger === "scroll_element") {
          const selector = matched.scrollElementSelector;
          if (selector) {
            const el = document.querySelector(selector);
            if (el && "IntersectionObserver" in window) {
              const observer = new IntersectionObserver((entries) => {
                if (entries[0]?.isIntersecting && !cancelled) {
                  activate();
                  observer.disconnect();
                }
              }, { threshold: 0.1 });
              observer.observe(el);
              cleanupTrigger = () => observer.disconnect();
            } else {
              activate();
            }
          } else {
            activate();
          }
        } else if (trigger === "click_selector") {
          const selector = matched.clickSelector;
          if (selector) {
            const handleClick = (e: MouseEvent) => {
              const target = e.target as HTMLElement | null;
              if (target?.closest(selector) && !cancelled) {
                e.preventDefault();
                activate();
              }
            };
            document.addEventListener("click", handleClick);
            cleanupTrigger = () => document.removeEventListener("click", handleClick);
          } else {
            activate();
          }
        }
      } catch {}
    }

    evaluatePopups();

    return () => {
      cancelled = true;
      if (cleanupTrigger) cleanupTrigger();
    };
  }, [pathname, matchPlacement, matchDevice, checkFrequency, recordImpression]);

  // Handle CTA button clicks
  const handleButtonClick = async (btn: PopupButton) => {
    if (!popup) return;
    trackAction(popup.id, "click");

    const targetSlug = btn.productSlug || popup.productSlug || (productData?.slug as string) || popup.targetProductSlug || "";
    const targetId = btn.productId || popup.productId || (productData?.id as string) || targetSlug;

    if (btn.actionType === "close") {
      dismiss();
      return;
    }

    if (btn.actionType === "add_to_cart" || btn.actionType === "buy_now") {
      if (targetId) {
        addToCart({ productId: targetId, quantity: 1 });
        setCartToast(`Added ${(productData?.name as string) || "product"} to care bag.`);
        setTimeout(() => setCartToast(""), 3500);
      }
      if (btn.actionType === "buy_now") {
        dismiss();
        router.push("/checkout");
      }
      return;
    }

    if (btn.actionType === "view_product" && targetSlug) {
      dismiss();
      router.push(`/products/${targetSlug}`);
      return;
    }

    if (btn.actionType === "product" && targetSlug) {
      dismiss();
      router.push(`/products/${targetSlug}`);
      return;
    }

    if (btn.actionType === "category" && btn.url) {
      dismiss();
      router.push(btn.url.startsWith("/") ? btn.url : `/categories/${btn.url}`);
      return;
    }

    if (btn.actionType === "blog" && btn.url) {
      dismiss();
      router.push(btn.url.startsWith("/") ? btn.url : `/blog/${btn.url}`);
      return;
    }

    if (btn.actionType === "whatsapp" && btn.url) {
      const cleanPhone = btn.url.replace(/[^0-9]/g, "");
      window.open(`https://wa.me/${cleanPhone}`, "_blank");
      dismiss();
      return;
    }

    if (btn.actionType === "phone" && btn.url) {
      window.location.assign(`tel:${btn.url}`);
      return;
    }

    if (btn.actionType === "email" && btn.url) {
      window.location.assign(`mailto:${btn.url}`);
      return;
    }

    // Default: link navigation
    if (btn.url) {
      dismiss();
      if (btn.url.startsWith("http")) {
        window.open(btn.url, "_blank");
      } else {
        router.push(btn.url);
      }
    }
  };

  // Handle clickable media
  const handleMediaClick = () => {
    if (!popup || !popup.mediaClickAction || popup.mediaClickAction === "none") return;
    trackAction(popup.id, "click");

    const url = popup.mediaClickUrl || "";
    if (popup.mediaClickAction === "product") {
      const slug = popup.productSlug || (productData?.slug as string) || url;
      if (slug) {
        dismiss();
        router.push(`/products/${slug}`);
      }
    } else if (popup.mediaClickAction === "whatsapp" && url) {
      window.open(`https://wa.me/${url.replace(/[^0-9]/g, "")}`, "_blank");
      dismiss();
    } else if (popup.mediaClickAction === "phone" && url) {
      window.location.href = `tel:${url}`;
    } else if (popup.mediaClickAction === "email" && url) {
      window.location.href = `mailto:${url}`;
    } else if (url) {
      dismiss();
      if (url.startsWith("http")) window.open(url, "_blank");
      else router.push(url);
    }
  };

  if (pathname?.startsWith("/admin") || !popup || !visible) return null;

  // Resolve active media
  const mediaUrl = popup.mediaType === "video" ? (popup.videoUrl || "") : (popup.imageUrl || "");
  const hasMedia = popup.mediaType !== "none" && Boolean(mediaUrl);
  const videoEmbed = popup.mediaType === "video" ? getVideoEmbed(mediaUrl, popup.videoAutoplay, popup.videoMuted, popup.videoLoop) : null;

  // Size calculations
  let widthVal = `min(${popup.width || 520}px, 94vw)`;
  if (popup.sizePreset === "small") widthVal = "min(400px, 94vw)";
  else if (popup.sizePreset === "medium") widthVal = "min(560px, 94vw)";
  else if (popup.sizePreset === "large") widthVal = "min(760px, 94vw)";
  else if (popup.sizePreset === "fullscreen") widthVal = "min(96vw, 1200px)";

  if (popup.maxWidth) widthVal = `min(${widthVal}, ${popup.maxWidth})`;

  // Position styles
  const positionStyles: React.CSSProperties = {};
  if (popup.position === "top") {
    positionStyles.top = 24;
    positionStyles.left = "50%";
    positionStyles.transform = "translateX(-50%)";
  } else if (popup.position === "bottom") {
    positionStyles.bottom = 24;
    positionStyles.left = "50%";
    positionStyles.transform = "translateX(-50%)";
  } else if (popup.position === "top-left") {
    positionStyles.top = 24;
    positionStyles.left = 24;
  } else if (popup.position === "top-right") {
    positionStyles.top = 24;
    positionStyles.right = 24;
  } else if (popup.position === "bottom-left") {
    positionStyles.bottom = 24;
    positionStyles.left = 24;
  } else if (popup.position === "bottom-right") {
    positionStyles.bottom = 24;
    positionStyles.right = 24;
  } else if (popup.position === "custom") {
    if (popup.customPositionTop) positionStyles.top = popup.customPositionTop;
    if (popup.customPositionBottom) positionStyles.bottom = popup.customPositionBottom;
    if (popup.customPositionLeft) positionStyles.left = popup.customPositionLeft;
    if (popup.customPositionRight) positionStyles.right = popup.customPositionRight;
  } else {
    // Default: center
    positionStyles.top = "50%";
    positionStyles.left = "50%";
    positionStyles.transform = "translate(-50%, -50%)";
  }

  // Animation CSS styles
  const animDuration = `${popup.animationDuration || 0.35}s`;
  let animName = "qcPopupFadeIn";
  if (popup.animation === "scale") animName = "qcPopupScale";
  else if (popup.animation === "slide-up") animName = "qcPopupSlideUp";
  else if (popup.animation === "slide-down") animName = "qcPopupSlideDown";
  else if (popup.animation === "slide-left") animName = "qcPopupSlideLeft";
  else if (popup.animation === "slide-right") animName = "qcPopupSlideRight";
  else if (popup.animation === "zoom") animName = "qcPopupZoom";
  else if (popup.animation === "none") animName = "none";

  // Background styling
  let cardBg = popup.bgColor || "#FFFFFF";
  if (popup.bgType === "gradient" && popup.bgGradient) cardBg = popup.bgGradient;
  else if (popup.bgType === "transparent") cardBg = "transparent";

  // Normalized buttons
  const buttonsList = Array.isArray(popup.buttons) && popup.buttons.length > 0
    ? popup.buttons
    : popup.buttonText
    ? [
        {
          id: "b-legacy",
          text: popup.buttonText,
          actionType: "link" as const,
          url: popup.buttonUrl || "#",
          style: "primary" as const,
        },
      ]
    : [];

  // Media element rendering
  const renderMedia = () => {
    if (!hasMedia) return null;

    const isClickable = popup.mediaClickAction && popup.mediaClickAction !== "none";
    const mediaContainerStyle: React.CSSProperties = {
      position: "relative",
      overflow: "hidden",
      cursor: isClickable ? "pointer" : "default",
      transition: "opacity 0.2s",
    };

    let mediaContent = null;

    if (popup.mediaType === "video" && videoEmbed) {
      if (videoEmbed.isIframe) {
        mediaContent = (
          <div style={{ position: "relative", width: "100%", paddingTop: "56.25%" }}>
            <iframe
              src={videoEmbed.src}
              title={popup.heading || "Queens Care Video"}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      } else {
        mediaContent = (
          <video
            src={videoEmbed.src}
            poster={popup.videoPosterUrl}
            autoPlay={popup.videoAutoplay}
            muted={popup.videoMuted !== false}
            loop={popup.videoLoop}
            controls={popup.videoControls !== false}
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onClick={(e) => {
              if (popup.videoPlayOnClick) {
                const vid = e.currentTarget;
                if (vid.paused) vid.play();
                else vid.pause();
              }
            }}
          />
        );
      }
    } else {
      mediaContent = (
        <img
          src={popup.imageUrl}
          alt={popup.heading || popup.title}
          style={{ width: "100%", height: "100%", maxHeight: 360, objectFit: "cover", display: "block" }}
        />
      );
    }

    return (
      <div style={mediaContainerStyle} onClick={handleMediaClick}>
        {mediaContent}
      </div>
    );
  };

  const isBeside = popup.mediaLayout === "beside_left" || popup.mediaLayout === "beside_right";
  const isMediaOnly = popup.mediaLayout === "media_only";

  return (
    <>
      <style>{`
        @keyframes qcPopupFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes qcPopupScale { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes qcPopupSlideUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes qcPopupSlideDown { from { opacity: 0; transform: translateY(-32px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes qcPopupSlideLeft { from { opacity: 0; transform: translateX(32px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes qcPopupSlideRight { from { opacity: 0; transform: translateX(-32px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes qcPopupZoom { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }

        @media (prefers-reduced-motion: reduce) {
          .qc-popup-animated { animation: none !important; }
        }

        @media (max-width: 767px) {
          .qc-popup-beside { grid-template-columns: 1fr !important; }
          .qc-popup-beside-rev { display: flex; flex-direction: column-reverse !important; }
        }
      `}</style>

      {/* Cart notification toast */}
      {cartToast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 100000,
            background: "var(--purple, #2A0F3A)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 8,
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>✓</span> {cartToast}
          <Link
            href="/cart"
            style={{ color: "#C5A880", textDecoration: "underline", marginLeft: 8 }}
          >
            View Bag →
          </Link>
        </div>
      )}

      {/* Backdrop overlay */}
      {popup.overlayEnabled !== false && (
        <div
          onClick={() => {
            if (popup.closeOnOverlayClick !== false) dismiss();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: popup.overlayColor || "rgba(0,0,0,0.6)",
            opacity: popup.overlayOpacity !== undefined ? popup.overlayOpacity : 0.55,
            backdropFilter: popup.overlayBlur ? `blur(${popup.overlayBlur}px)` : undefined,
            WebkitBackdropFilter: popup.overlayBlur ? `blur(${popup.overlayBlur}px)` : undefined,
            zIndex: 99998,
            animation: "qcPopupFadeIn 0.3s ease-out",
          }}
        />
      )}

      {/* Main Popup Modal */}
      <div
        ref={popupRef}
        role="dialog"
        aria-modal="true"
        aria-label={popup.heading || popup.title}
        className="qc-popup-animated"
        style={{
          position: "fixed",
          ...positionStyles,
          width: widthVal,
          maxHeight: popup.maxHeight || "88vh",
          overflowY: "auto",
          background: cardBg,
          color: popup.textColor || "var(--ink, #1F1A24)",
          borderRadius: popup.borderRadius || 16,
          border: popup.borderWidth ? `${popup.borderWidth}px solid ${popup.borderColor || "rgba(42,15,58,0.08)"}` : "none",
          boxShadow: popup.shadowEnabled !== false ? `0 24px ${popup.shadowBlur || 48}px ${popup.shadowColor || "rgba(0,0,0,0.24)"}` : "none",
          zIndex: 99999,
          animation: animName !== "none" ? `${animName} ${animDuration} cubic-bezier(0.16, 1, 0.3, 1)` : "none",
        }}
      >
        {/* Close button */}
        {popup.showCloseButton !== false && (
          <button
            onClick={dismiss}
            aria-label="Close popup"
            style={{
              position: "absolute",
              top: popup.closeButtonPosition === "inside_left" ? 14 : 14,
              left: popup.closeButtonPosition === "inside_left" ? 14 : undefined,
              right: popup.closeButtonPosition === "inside_left" ? undefined : 14,
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: popup.closeButtonBg || "rgba(0,0,0,0.06)",
              color: popup.closeButtonColor || "rgba(0,0,0,0.7)",
              fontSize: 16,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              zIndex: 10,
              transition: "transform 0.15s ease, background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            ✕
          </button>
        )}

        {/* Media Only layout */}
        {isMediaOnly && renderMedia()}

        {/* Standard Card Layouts */}
        {!isMediaOnly && (
          <div
            className={
              popup.mediaLayout === "beside_left"
                ? "qc-popup-beside"
                : popup.mediaLayout === "beside_right"
                ? "qc-popup-beside qc-popup-beside-rev"
                : ""
            }
            style={{
              display: isBeside ? "grid" : "block",
              gridTemplateColumns: isBeside ? "1fr 1.15fr" : undefined,
            }}
          >
            {/* Media above or beside left */}
            {(popup.mediaLayout === "above" || popup.mediaLayout === "beside_left") && renderMedia()}

            {/* Content block */}
            <div
              style={{
                padding: popup.padding !== undefined ? popup.padding : 28,
                textAlign: popup.fontAlignment || "left",
              }}
            >
              {/* Eyebrow badge */}
              {popup.eyebrow && (
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    background: "rgba(197, 168, 128, 0.15)",
                    color: popup.accentColor || "#C5A880",
                    borderRadius: 100,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  {popup.eyebrow}
                </span>
              )}

              {/* Heading */}
              {popup.heading && (
                <h3
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(popup.heading) }}
                  style={{
                    margin: "0 0 10px",
                    fontSize: popup.headingSize || 24,
                    fontWeight: 700,
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    color: popup.headingColor || "var(--purple, #2A0F3A)",
                    lineHeight: 1.25,
                  }}
                />
              )}

              {/* Subtitle */}
              {popup.subtitle && (
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: popup.accentColor || "#C5A880",
                    letterSpacing: ".04em",
                  }}
                >
                  {popup.subtitle}
                </p>
              )}

              {/* Body Text */}
              {popup.text && (
                <p
                  style={{
                    margin: "0 0 16px",
                    fontSize: popup.bodySize || 14,
                    lineHeight: 1.65,
                    color: popup.textColor || "var(--muted, #555)",
                  }}
                >
                  {popup.text}
                </p>
              )}

              {/* Highlight callout / Coupon banner */}
              {popup.highlightText && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(42, 15, 58, 0.04)",
                    border: "1px dashed rgba(197, 168, 128, 0.5)",
                    borderRadius: 8,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--purple, #2A0F3A)", letterSpacing: ".05em" }}>
                    {popup.highlightText}
                  </span>
                  <button
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(popup.highlightText || "");
                        setCartToast("Code copied to clipboard!");
                        setTimeout(() => setCartToast(""), 2500);
                      }
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: popup.accentColor || "#C5A880",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      textTransform: "uppercase",
                    }}
                  >
                    Copy
                  </button>
                </div>
              )}

              {/* Bullet points */}
              {Array.isArray(popup.bulletList) && popup.bulletList.length > 0 && (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {popup.bulletList.filter(Boolean).map((bullet, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        fontSize: 12,
                        color: "var(--ink, #1F1A24)",
                      }}
                    >
                      <span style={{ color: popup.accentColor || "#C5A880", fontWeight: 800 }}>✓</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Product Aware Card */}
              {(popup.productAware || productData) && productData && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: 12,
                    background: "#FAF9F7",
                    borderRadius: 10,
                    border: "1px solid rgba(42, 15, 58, 0.06)",
                    marginBottom: 18,
                  }}
                >
                  {popup.showProductImage !== false && Boolean(productData.image || productData.thumbnail) && (
                    <img
                      src={(productData.image as string) || (productData.thumbnail as string)}
                      alt={(productData.name as string) || ""}
                      style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink, #1F1A24)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {productData.name as string}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                      {popup.showProductPrice !== false && productData.price !== undefined && (
                        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--purple, #2A0F3A)" }}>
                          ₹{Number(productData.price).toLocaleString("en-IN")}
                        </span>
                      )}
                      {Boolean(productData.mrp) && Number(productData.mrp) > Number(productData.price) ? (
                        <span style={{ fontSize: 11, textDecoration: "line-through", color: "var(--muted)" }}>
                          ₹{Number(productData.mrp).toLocaleString("en-IN")}
                        </span>
                      ) : null}
                    </div>
                    {popup.showProductStock !== false && productData.stock !== undefined && (
                      <span style={{ fontSize: 10, color: Number(productData.stock) > 0 ? "#2e7d32" : "#c62828", fontWeight: 600 }}>
                        {Number(productData.stock) > 0 ? "● Ready to Dispense" : "○ Currently Reserved"}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Divider */}
              {popup.divider && (
                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid rgba(42, 15, 58, 0.08)",
                    margin: "16px 0",
                  }}
                />
              )}

              {/* Multi-Button Actions */}
              {buttonsList.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    justifyContent: popup.fontAlignment === "center" ? "center" : popup.fontAlignment === "right" ? "flex-end" : "flex-start",
                  }}
                >
                  {buttonsList.map((btn) => {
                    const isPrimary = btn.style === "primary";
                    const isSecondary = btn.style === "secondary";
                    const isOutline = btn.style === "outline";
                    const isGhost = btn.style === "ghost";

                    let btnBg = "var(--purple, #2A0F3A)";
                    let btnColor = "#FFFFFF";
                    let btnBorder = "none";

                    if (isSecondary) {
                      btnBg = "#C5A880";
                      btnColor = "#FFFFFF";
                    } else if (isOutline) {
                      btnBg = "transparent";
                      btnColor = "var(--purple, #2A0F3A)";
                      btnBorder = "1px solid var(--purple, #2A0F3A)";
                    } else if (isGhost) {
                      btnBg = "transparent";
                      btnColor = "var(--purple, #2A0F3A)";
                    } else if (btn.style === "custom") {
                      if (btn.bgColor) btnBg = btn.bgColor;
                      if (btn.textColor) btnColor = btn.textColor;
                      if (btn.borderColor) btnBorder = `1px solid ${btn.borderColor}`;
                    }

                    return (
                      <button
                        key={btn.id}
                        onClick={() => handleButtonClick(btn)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "11px 22px",
                          background: btnBg,
                          color: btnColor,
                          border: btnBorder,
                          borderRadius: btn.borderRadius !== undefined ? btn.borderRadius : 100,
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: ".06em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          transition: "transform 0.15s ease, opacity 0.2s",
                          width: btn.isFullWidth ? "100%" : undefined,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.9";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {btn.icon === "cart" && <span>🛍️</span>}
                        {btn.icon === "whatsapp" && <span>💬</span>}
                        {btn.icon === "phone" && <span>📞</span>}
                        {btn.icon === "star" && <span>✦</span>}
                        <span>{btn.text}</span>
                        {btn.icon === "arrow" && <span>→</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Media beside right or below */}
            {(popup.mediaLayout === "beside_right" || popup.mediaLayout === "below") && renderMedia()}
          </div>
        )}
      </div>
    </>
  );
}
