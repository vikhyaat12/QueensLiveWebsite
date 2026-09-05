"use client";

import { useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   PREMIUM ANIMATIONS — GSAP + Lenis layer
   Adds: smooth scroll, scroll-reveal, text mask, marquee,
         custom cursor, magnetic buttons.
   Does NOT modify any existing component.
   ═══════════════════════════════════════════════════════════════ */

export default function PremiumAnimations() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<unknown>(null);
  const initialized = useRef(false);

  const initAnimations = useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true;

    const gsapModule = await import("gsap");
    const gsap = gsapModule.default;
    const { ScrollTrigger } = await import("gsap/ScrollTrigger");
    gsap.registerPlugin(ScrollTrigger);

    const LenisModule = await import("lenis");
    const Lenis = LenisModule.default;

    const REDUCED = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    /* ── 1. SMOOTH SCROLL (Lenis) ────────────────────────────── */
    let lenis: InstanceType<typeof Lenis> | null = null;
    if (!REDUCED) {
      lenis = new Lenis({
        duration: 1.1,
        smoothWheel: true,
        wheelMultiplier: 0.9,
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t: number) => lenis!.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      (lenisRef as React.MutableRefObject<unknown>).current = lenis;
    }

    /* ── 2. SCROLL-REVEAL HEADINGS (data-split) ──────────────── */
    function splitText(el: HTMLElement) {
      if (el.dataset.split === "done") return;
      const words = el.textContent!.trim().split(/\s+/);
      el.innerHTML = words
        .map((w) => `<span class="premium-word">${w}</span>`)
        .join(" ");
      el.dataset.split = "done";

      const spans = el.querySelectorAll<HTMLElement>(".premium-word");
      const rows = new Map<number, HTMLElement[]>();
      spans.forEach((s) => {
        const top = Math.round(s.offsetTop);
        if (!rows.has(top)) rows.set(top, []);
        rows.get(top)!.push(s);
      });

      el.innerHTML = "";
      rows.forEach((row) => {
        const line = document.createElement("span");
        line.className = "premium-line";
        row.forEach((w, i) => {
          line.appendChild(w);
          if (i < row.length - 1)
            line.appendChild(document.createTextNode(" "));
        });
        el.appendChild(line);
      });
    }

    /* Mark headings that should animate */
    document
      .querySelectorAll<HTMLElement>(
        ".hero h1, .science h2, .section h2, .ritual .section-head h2, .quote blockquote, .consult h2"
      )
      .forEach((el) => {
        if (el.dataset.premiumSplit || el.dataset.noSplit || el.classList.contains("no-split")) return;
        el.dataset.premiumSplit = "true";
        splitText(el);
        const words = el.querySelectorAll<HTMLElement>(".premium-word");
        gsap.set(words, { yPercent: 115 });
        ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          once: true,
          onEnter: () =>
            gsap.to(words, {
              yPercent: 0,
              duration: 1,
              ease: "power4.out",
              stagger: 0.04,
            }),
        });
      });

    /* ── 3. FADE-IN REVEALS (data-fade-reveal) ───────────────── */
    document
      .querySelectorAll<HTMLElement>(
        ".eyebrow, .lead, .hero-ctas, .ratings, .section-head, .science-copy > p:not(.eyebrow), .ritual-card, .consult .button"
      )
      .forEach((el) => {
        if (el.dataset.premiumFade) return;
        el.dataset.premiumFade = "true";
        gsap.set(el, { y: 28, opacity: 0 });
        ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: () =>
            gsap.to(el, {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: "power3.out",
            }),
        });
      });

    /* ── 4. STAGGER REVEALS (product cards, ritual cards) ─────── */
    ScrollTrigger.batch(
      ".product, .ritual-card, .journal-grid article",
      {
        start: "top 88%",
        onEnter: (batch) =>
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.07,
            overwrite: true,
          }),
      }
    );
    gsap.set(
      ".product, .ritual-card, .journal-grid article",
      { y: 40, opacity: 0 }
    );

    /* ── 5. PARALLAX on hero visual ───────────────────────────── */
    if (!REDUCED) {
      document
        .querySelectorAll<HTMLElement>(".hero-visual, .hero-visual-3d-container")
        .forEach((el) => {
          gsap.to(el, {
            yPercent: -12,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          });
        });
    }

    /* ── 6. PRODUCT IMAGES scale on scroll ────────────────────── */
    if (!REDUCED) {
      document.querySelectorAll<HTMLElement>(".product-image img").forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 1.08 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          }
        );
      });
    }

    /* ── 7. SCIENCE stat-card pop-in ──────────────────────────── */
    document.querySelectorAll<HTMLElement>(".stat-card").forEach((el) => {
      if (el.dataset.premiumFade) return;
      el.dataset.premiumFade = "true";
      gsap.set(el, { scale: 0.85, opacity: 0 });
      ScrollTrigger.create({
        trigger: el,
        start: "top 80%",
        once: true,
        onEnter: () =>
          gsap.to(el, {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            ease: "back.out(1.5)",
          }),
      });
    });

    /* ── 8. QUOTE section entrance ────────────────────────────── */
    const quoteEl = document.querySelector<HTMLElement>(".quote blockquote");
    if (quoteEl && !quoteEl.dataset.premiumSplit) {
      quoteEl.dataset.premiumSplit = "true";
      splitText(quoteEl);
      const words = quoteEl.querySelectorAll<HTMLElement>(".premium-word");
      gsap.set(words, { yPercent: 115 });
      ScrollTrigger.create({
        trigger: quoteEl,
        start: "top 82%",
        once: true,
        onEnter: () =>
          gsap.to(words, {
            yPercent: 0,
            duration: 1,
            ease: "power4.out",
            stagger: 0.035,
          }),
      });
    }

    /* ── 9. CONSULT section background morph ──────────────────── */
    const consultSection = document.querySelector<HTMLElement>(".consult");
    if (consultSection) {
      gsap.fromTo(
        consultSection,
        { opacity: 0.7 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: consultSection,
            start: "top 80%",
            end: "top 30%",
            scrub: true,
          },
        }
      );
    }

    /* ── 10. MAGNETIC BUTTONS ─────────────────────────────────── */
    if (!REDUCED && window.matchMedia("(hover:hover)").matches) {
      document.querySelectorAll<HTMLElement>(".button, .text-link, .bag").forEach((el) => {
        const xTo = gsap.quickTo(el, "x", {
          duration: 0.5,
          ease: "power3",
        });
        const yTo = gsap.quickTo(el, "y", {
          duration: 0.5,
          ease: "power3",
        });
        el.addEventListener("mousemove", (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.25);
        });
        el.addEventListener("mouseleave", () => {
          xTo(0);
          yTo(0);
        });
      });
    }

    /* ── 11. ANNOUNCEMENT MARQUEE ─────────────────────────────── */
    const announce = document.querySelector<HTMLElement>(".announcement");
    if (announce && !announce.dataset.premiumMarquee) {
      announce.dataset.premiumMarquee = "true";
      // Add subtle scroll-linked opacity
      gsap.fromTo(
        announce,
        { opacity: 1 },
        {
          opacity: 0.6,
          ease: "none",
          scrollTrigger: {
            trigger: announce,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }

    /* ── 12. CUSTOM CURSOR ────────────────────────────────────── */
    if (
      !REDUCED &&
      window.matchMedia("(hover:hover)").matches &&
      cursorRef.current &&
      ringRef.current
    ) {
      const dot = gsap.quickTo(cursorRef.current, "x", {
        duration: 0.15,
        ease: "power3",
      });
      const dotY = gsap.quickTo(cursorRef.current, "y", {
        duration: 0.15,
        ease: "power3",
      });
      const rng = gsap.quickTo(ringRef.current, "x", {
        duration: 0.45,
        ease: "power3",
      });
      const rngY = gsap.quickTo(ringRef.current, "y", {
        duration: 0.45,
        ease: "power3",
      });

      window.addEventListener("mousemove", (e: MouseEvent) => {
        dot(e.clientX);
        dotY(e.clientY);
        rng(e.clientX);
        rngY(e.clientY);
      });

      /* Hover state on interactive elements */
      const addHoverClass = () => cursorRef.current?.classList.add("is-hover");
      const removeHoverClass = () =>
        cursorRef.current?.classList.remove("is-hover");
      document
        .querySelectorAll<HTMLElement>("a, button, .product, .ritual-card")
        .forEach((el) => {
          el.addEventListener("mouseenter", addHoverClass);
          el.addEventListener("mouseleave", removeHoverClass);
        });
    }

    /* ── 13. STAGE BACKGROUND — scroll-linked colour morph ────── */
    const stage = document.querySelector<HTMLElement>(".stage-bg");
    if (stage && !REDUCED) {
      const sections = document.querySelectorAll<HTMLElement>(
        ".science, .ritual, .consult, .product-spotlight"
      );
      sections.forEach((section) => {
        const bgColor =
          window.getComputedStyle(section).backgroundColor || "var(--paper)";
        ScrollTrigger.create({
          trigger: section,
          start: "top 60%",
          end: "bottom 40%",
          onEnter: () =>
            gsap.to(stage, {
              backgroundColor: bgColor,
              duration: 0.9,
              ease: "power2.out",
            }),
          onEnterBack: () =>
            gsap.to(stage, {
              backgroundColor: bgColor,
              duration: 0.9,
              ease: "power2.out",
            }),
          onLeave: () =>
            gsap.to(stage, {
              backgroundColor: "var(--paper)",
              duration: 0.9,
              ease: "power2.out",
            }),
          onLeaveBack: () =>
            gsap.to(stage, {
              backgroundColor: "var(--paper)",
              duration: 0.9,
              ease: "power2.out",
            }),
        });
      });
    }

    /* ── 14. GALLERY PARALLAX ────────────────────────────────── */
    if (!REDUCED) {
      document
        .querySelectorAll<HTMLElement>(
          ".premium-gallery .gallery-item"
        )
        .forEach((el) => {
          gsap.fromTo(
            el,
            { y: 60, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1.1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 90%",
                once: true,
              },
            }
          );
        });
    }

    /* ── 15. SPOTLIGHT SECTIONS — art float + copy entrance ──── */
    document
      .querySelectorAll<HTMLElement>(".product-spotlight")
      .forEach((spot) => {
        const art = spot.querySelector<HTMLElement>(".spotlight-art img");
        const copy = spot.querySelector<HTMLElement>("> .spotlight-copy > p");
        const facts = spot.querySelectorAll<HTMLElement>("> .spotlight-copy .spotlight-facts li");

        if (art && !REDUCED) {
          gsap.fromTo(
            art,
            { yPercent: 14, rotate: 4, scale: 0.94 },
            {
              yPercent: -14,
              rotate: -3,
              scale: 1.02,
              ease: "none",
              scrollTrigger: {
                trigger: spot,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            }
          );
        }
        if (copy) {
          gsap.from(copy, {
            y: 30,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: spot,
              start: "top 65%",
              once: true,
            },
          });
        }
        if (facts.length > 0) {
          gsap.from(facts, {
            y: 24,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: spot,
              start: "top 60%",
              once: true,
            },
          });
        }
      });

    /* ── Refresh after fonts settle ───────────────────────────── */
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  useEffect(() => {
    initAnimations();

    return () => {
      /* cleanup */
      if (lenisRef.current && typeof (lenisRef.current as { destroy: () => void }).destroy === "function") {
        (lenisRef.current as { destroy: () => void }).destroy();
      }
      initialized.current = false;
    };
  }, [initAnimations]);

  return (
    <>
      {/* Custom cursor */}
      <div ref={cursorRef} className="premium-cursor" aria-hidden="true">
        <span className="premium-cursor__dot" />
        <span ref={ringRef} className="premium-cursor__ring" />
      </div>
    </>
  );
}
