"use client";

import { useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   PREMIUM ANIMATIONS — GSAP + Lenis layer
   Adds: smooth scroll, scroll-reveal, text mask, marquee,
         magnetic buttons (native browser cursor restored).
   Does NOT modify any existing component.
   ═══════════════════════════════════════════════════════════════ */

export default function PremiumAnimations() {
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
    if (!REDUCED) {
      document
        .querySelectorAll<HTMLElement>(
          ".eyebrow, .lead, .hero-ctas, .ratings, .section-head, .science-copy > p:not(.eyebrow), .consult .button"
        )
        .forEach((el) => {
          if (el.dataset.premiumFade) return;
          el.dataset.premiumFade = "true";
          ScrollTrigger.create({
            trigger: el,
            start: "top 92%",
            once: true,
            onEnter: () =>
              gsap.fromTo(
                el,
                { y: 20, opacity: 0.3 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.7,
                  ease: "power2.out",
                  overwrite: "auto",
                }
              ),
          });
        });
    }

    /* ── 4. STAGGER REVEALS (product cards, ritual cards) ─────── */
    if (!REDUCED) {
      ScrollTrigger.batch(
        ".collection article, .ritual-card-hover, .journal-reference-section article",
        {
          start: "top 95%",
          once: true,
          onEnter: (batch) =>
            gsap.fromTo(
              batch,
              { y: 20, opacity: 0.3 },
              {
                y: 0,
                opacity: 1,
                duration: 0.6,
                ease: "power2.out",
                stagger: 0.04,
                overwrite: "auto",
              }
            ),
        }
      );
    }

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
      document.querySelectorAll<HTMLElement>(".collection article img").forEach((el) => {
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

    /* ── 12. CINEMATIC PAGE MOTION EXTENSIONS ─────────────────── */
    if (!REDUCED) {
      // A. Hero entrance sequence
      gsap.fromTo(
        ".cinematic-hero-stage-root",
        { scale: 0.95, opacity: 0.7 },
        { scale: 1, opacity: 1, duration: 1.2, ease: "power2.out" }
      );

      // B. Category reveal
      ScrollTrigger.batch("#qc-cat-track button", {
        start: "top 95%",
        once: true,
        onEnter: (batch) =>
          gsap.fromTo(
            batch,
            { y: 16, opacity: 0.4 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.03, ease: "power2.out" }
          ),
      });

      // C. Product Card 3D Depth & Tilt on Hover
      if (window.matchMedia("(hover:hover)").matches) {
        document.querySelectorAll<HTMLElement>(".collection article").forEach((card) => {
          card.style.transformStyle = "preserve-3d";
          card.addEventListener("mousemove", (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
            card.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${y}deg) translateY(-4px)`;
          });
          card.addEventListener("mouseleave", () => {
            card.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0)";
          });
        });
      }

      // D. Science Scene Reveal
      const scienceCard = document.querySelector<HTMLElement>(".science-results-card");
      if (scienceCard) {
        ScrollTrigger.create({
          trigger: scienceCard,
          start: "top 88%",
          once: true,
          onEnter: () =>
            gsap.fromTo(
              scienceCard,
              { y: 24, opacity: 0.6 },
              { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
            ),
        });
      }

      // E. Trust Section Transition
      const trustSec = document.querySelector<HTMLElement>(".trust-section");
      if (trustSec) {
        ScrollTrigger.create({
          trigger: trustSec,
          start: "top 90%",
          once: true,
          onEnter: () =>
            gsap.fromTo(
              trustSec,
              { y: 20, opacity: 0.6 },
              { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" }
            ),
        });
      }

      // F. AI Assistant Card Reveal
      const aiBanner = document.querySelector<HTMLElement>(".dr-queens-banner-card");
      if (aiBanner) {
        ScrollTrigger.create({
          trigger: aiBanner,
          start: "top 88%",
          once: true,
          onEnter: () =>
            gsap.fromTo(
              aiBanner,
              { y: 24, opacity: 0.6 },
              { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
            ),
        });
      }
    }

    /* ── 12. CUSTOM CURSOR (REMOVED) ─────────────────────────── */
    /* Native browser cursor restored; zero cursor-following, dot, ring, or tracking overlays */

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

  return null;
}
