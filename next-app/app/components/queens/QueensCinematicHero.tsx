"use client";

/**
 * Queens Care — Cinematic Hero (additive, data-driven)
 *
 * What it is:
 * - An 8-step choreographed entrance: background/light fade, brand,
 *   character entrance, original product reveal, gentle gesture,
 *   headline, CTA, calm interactive state.
 * - Desktop-only gentle mouse parallax. No WebGL dependency, so the
 *   hero works with a beautiful static fallback when WebGL is absent.
 * - Reduced-motion and "Skip animation" support. Animation never blocks
 *   shopping: CTAs are rendered and usable from the first frame.
 *
 * What it is NOT:
 * - It does not claim the character is a rigged 3D model. The character
 *   is the existing original image (default: /images/hero/dr-queens-hd.webp),
 *   presented with layered CSS 3D depth. A future GLB/GLTF model can be
 *   passed via `characterModelUrl`, and only then should copy say "3D model".
 * - It does not regenerate the bottle. The product image is the original
 *   uploaded product image, undistorted, with studio light/shadow around it.
 * - The character is a fictional brand guide, not a real doctor and not
 *   a medical adviser. Do not add credentials or medical advice here.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { QueensHeroContent } from "@/lib/queens-homepage-content";

type Props = {
  content: QueensHeroContent;
  /** Existing product detail URL, e.g. from the product's slug. */
  productHref?: string;
  onOpenQuiz?: () => void;
};

const PHASES = [
  "background",
  "brand",
  "character",
  "product",
  "gesture",
  "headline",
  "cta",
  "settled",
] as const;

export default function QueensCinematicHero({ content, productHref, onOpenQuiz }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const animationEnabled = content.animationEnabled !== false && !reducedMotion && !skipped;
  const phase = PHASES[animationEnabled ? phaseIndex : PHASES.length - 1];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!animationEnabled) return;
    // Short, premium entrance — never a long blocking intro.
    const delays = [250, 500, 900, 1400, 1900, 2300, 2600, 3000];
    const timers = delays.map((ms, i) => window.setTimeout(() => setPhaseIndex(i), ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [animationEnabled]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !rootRef.current) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    const rect = rootRef.current.getBoundingClientRect();
    setParallax({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  }, [reducedMotion]);

  const stepVisible = (step: (typeof PHASES)[number]) =>
    PHASES.indexOf(step) <= PHASES.indexOf(phase);

  const character = content.character;
  const characterImage = character.mobileImage ?? character.image;
  const intensity = content.animationIntensity ?? 1;

  return (
    <section
      ref={rootRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
      className="queens-hero"
      aria-label="Queens Care hero"
      style={{
        ["--queens-parallax-x" as string]: `${parallax.x * 10 * intensity}px`,
        ["--queens-parallax-y" as string]: `${parallax.y * 8 * intensity}px`,
      }}
    >
      <div className="queens-hero-stage" data-phase={phase}>
        <div className="queens-hero-backdrop" aria-hidden="true" />

        <div className="queens-hero-copy">
          {stepVisible("brand") && (
            <p className="queens-eyebrow">Queens Care Laboratories</p>
          )}
          {stepVisible("headline") && (
            <>
              <h1 className="queens-serif">{content.headline}</h1>
              {content.subtitle ? <p className="queens-hero-subtitle">{content.subtitle}</p> : null}
              {content.description ? <p className="queens-hero-description">{content.description}</p> : null}
            </>
          )}
          {stepVisible("cta") && (
            <div className="queens-hero-ctas">
              {content.primaryCta ? (
                <Link href={content.primaryCta.href} className="queens-btn queens-btn-primary">
                  {content.primaryCta.label}
                </Link>
              ) : null}
              {content.secondaryCta ? (
                <Link href={content.secondaryCta.href} className="queens-btn queens-btn-outline">
                  {content.secondaryCta.label}
                </Link>
              ) : null}
              {onOpenQuiz ? (
                <button type="button" className="queens-btn queens-btn-gold" onClick={onOpenQuiz}>
                  Take the Quiz
                </button>
              ) : null}
            </div>
          )}
        </div>

        {character.visible !== false && (
          <div
            className="queens-hero-character"
            data-visible={stepVisible("character")}
            data-gesture={stepVisible("gesture")}
          >
            {/* Original character image only — never regenerated. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={characterImage}
              alt="Queens Care brand character"
              width={520}
              height={640}
              loading="eager"
              fetchPriority="high"
            />
            <p className="queens-hero-character-note">
              A friendly brand guide — not a medical adviser.
            </p>
          </div>
        )}

        {stepVisible("product") && content.heroProductImage && (
          <div className="queens-hero-product">
            {/* Original product image only — label, logo and proportions preserved. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.heroProductImage}
              alt="Featured Queens Care product"
              width={420}
              height={520}
              loading="eager"
              fetchPriority="high"
            />
            {productHref ? (
              <Link href={productHref} className="queens-btn queens-btn-outline queens-hero-product-cta">
                Explore Product
              </Link>
            ) : null}
          </div>
        )}
      </div>

      {animationEnabled && (
        <button
          type="button"
          className="queens-hero-skip"
          onClick={() => setSkipped(true)}
        >
          Skip animation
        </button>
      )}

      <style>{`
        .queens-hero { position: relative; overflow: hidden; background: linear-gradient(135deg, #faf7f1 0%, #f6f1ea 45%, #efeaf8 100%); }
        .queens-hero-stage { position: relative; max-width: 1240px; margin: 0 auto; padding: 48px 16px 64px; display: grid; gap: 32px; perspective: 1200px; }
        @media (min-width: 1024px) { .queens-hero-stage { grid-template-columns: 1.05fr 0.95fr; align-items: center; min-height: 680px; padding: 64px 32px; } }
        .queens-hero-backdrop { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 65% 55% at 78% 30%, rgba(193,154,107,.18) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 20% 80%, rgba(42,15,58,.10) 0%, transparent 55%); }
        .queens-hero-copy { position: relative; z-index: 3; }
        .queens-hero-copy h1 { font-size: clamp(2rem, 5vw, 3.75rem); line-height: 1.05; color: #2a0f3a; margin: 12px 0 16px; }
        .queens-hero-subtitle { font-size: 1.25rem; color: #4a2a63; }
        .queens-hero-description { color: #333; line-height: 1.7; max-width: 520px; }
        .queens-hero-ctas { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
        .queens-hero-character { position: relative; z-index: 2; transform: translate3d(var(--queens-parallax-x), var(--queens-parallax-y), 0); transition: transform .3s ease, opacity .6s ease; opacity: 0; }
        .queens-hero-character[data-visible="true"] { opacity: 1; animation: queensBreath 5s ease-in-out infinite; }
        .queens-hero-character[data-gesture="true"] { transform: translate3d(var(--queens-parallax-x), calc(var(--queens-parallax-y) - 4px), 0) rotate(0.5deg); }
        .queens-hero-character img { width: 100%; height: auto; max-width: 520px; filter: drop-shadow(0 24px 40px rgba(42,15,58,.22)); }
        .queens-hero-character-note { font-size: 12px; color: #6b6570; text-align: center; }
        .queens-hero-product { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 16px; animation: queensProductIn .8s cubic-bezier(.22,1,.36,1) both; }
        .queens-hero-product img { width: 100%; height: auto; max-width: 420px; filter: drop-shadow(0 28px 48px rgba(42,15,58,.20)); }
        @keyframes queensBreath { 0%,100% { translate: 0 0; } 50% { translate: 0 -6px; } }
        @keyframes queensProductIn { from { opacity: 0; transform: translateY(18px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .queens-hero-skip { position: absolute; right: 16px; bottom: 16px; z-index: 5; background: rgba(255,255,255,.85); border: 1px solid rgba(42,15,58,.18); border-radius: 999px; padding: 8px 14px; font-size: 13px; cursor: pointer; }
        @media (prefers-reduced-motion: reduce) { .queens-hero-character[data-visible="true"], .queens-hero-product { animation: none; } }
      `}</style>
    </section>
  );
}
