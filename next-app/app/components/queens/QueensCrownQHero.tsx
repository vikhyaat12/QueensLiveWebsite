"use client";

/**
 * Queens Care — Crown Q Stage Hero
 *
 * The unique, eye-catching hero the user asked for, WITHOUT a 3D bottle.
 *
 * Assets (originals only, never regenerated or distorted):
 * - Logo: the user-supplied Queens Care gold logo — crowned Q with the
 *   female doctor in a white coat holding a bottle. Copy the supplied
 *   file to `public/images/hero/queens-care-logo.png` for local testing.
 * - Bottle: the user-supplied Liko Q Suspension 200ml bottle. Copy it
 *   to `public/images/hero/liko-q-bottle.png` for local testing.
 *
 * 3D feel without a 3D model:
 * - CSS perspective + desktop-only mouse parallax
 * - Gentle bottle float, gold light sweep, soft shadow and orange glow
 *   taken from the bottle's own orange flavour label
 * - Orbit chips use ONLY words from the bottle label:
 *   Lycopene, Vitamins, Minerals, 200ml
 *
 * The logo character is a fictional brand guide, not a real doctor
 * and not a medical adviser. No medical claim is made here.
 * Animation never blocks shopping; Skip animation and reduced-motion
 * support are included.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Props = {
  headline: string;
  subtitle?: string;
  logoImage?: string;
  bottleImage?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  productHref?: string;
  orbitChips?: string[];
};

export default function QueensCrownQHero({
  headline,
  subtitle,
  logoImage = "/images/hero/queens-care-logo.png",
  bottleImage = "/images/hero/liko-q-bottle.png",
  primaryCta,
  secondaryCta,
  productHref,
  orbitChips = ["Lycopene", "Vitamins", "Minerals", "200ml"],
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [settled, setSettled] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion || skipped) {
      setSettled(true);
      return;
    }
    const timer = window.setTimeout(() => setSettled(true), 2600);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, skipped]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !rootRef.current) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    const rect = rootRef.current.getBoundingClientRect();
    setParallax({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  }, [reducedMotion]);

  return (
    <section
      ref={rootRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
      className="queens-crown-hero"
      aria-label="Queens Care hero"
      style={{
        ["--queens-parallax-x" as string]: `${parallax.x * 12}px`,
        ["--queens-parallax-y" as string]: `${parallax.y * 9}px`,
      }}
    >
      <div className={`queens-crown-stage ${settled ? "settled" : ""}`}>
        <div className="queens-crown-copy">
          <p className="queens-eyebrow">Queens Care Laboratories</p>
          <h1 className="queens-serif">{headline}</h1>
          {subtitle ? <p className="queens-crown-subtitle">{subtitle}</p> : null}
          <div className="queens-hero-ctas">
            {primaryCta ? (
              <Link href={primaryCta.href} className="queens-btn queens-btn-primary">
                {primaryCta.label}
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link href={secondaryCta.href} className="queens-btn queens-btn-outline">
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="queens-crown-visual">
          {/* Original logo only — doctor, crown and Q preserved. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="queens-crown-logo"
            src={logoImage}
            alt="Queens Care Laboratories logo"
            width={520}
            height={520}
            loading="eager"
            fetchPriority="high"
          />
          <div className="queens-crown-bottle-wrap">
            {/* Original Liko Q bottle only — label preserved, undistorted. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="queens-crown-bottle"
              src={bottleImage}
              alt="Liko Q Suspension 200ml bottle"
              width={360}
              height={480}
              loading="eager"
              fetchPriority="high"
            />
            <div className="queens-crown-orbit" aria-hidden="true">
              {orbitChips.map((chip, i) => (
                <span key={chip} className={`queens-orbit-chip chip-${i}`}>
                  {chip}
                </span>
              ))}
            </div>
            {productHref ? (
              <Link href={productHref} className="queens-btn queens-btn-gold queens-crown-shop">
                Shop Liko Q
              </Link>
            ) : null}
          </div>
          <p className="queens-hero-character-note">
            A friendly brand guide — not a medical adviser.
          </p>
        </div>
      </div>

      {!reducedMotion && !settled && (
        <button type="button" className="queens-hero-skip" onClick={() => setSkipped(true)}>
          Skip animation
        </button>
      )}

      <style>{`
        .queens-crown-hero { position: relative; overflow: hidden; background: linear-gradient(135deg, #2a0f3a 0%, #3b1a52 45%, #faf7f1 100%); }
        .queens-crown-stage { position: relative; max-width: 1240px; margin: 0 auto; padding: 48px 16px 64px; display: grid; gap: 32px; perspective: 1200px; }
        @media (min-width: 1024px) { .queens-crown-stage { grid-template-columns: 1fr 1fr; align-items: center; min-height: 720px; } }
        .queens-crown-copy { color: #fff; position: relative; z-index: 3; }
        @media (min-width: 1024px) { .queens-crown-copy { color: #fff; } }
        .queens-crown-copy h1 { font-size: clamp(2.25rem, 5.5vw, 4rem); line-height: 1.02; margin: 12px 0 16px; }
        .queens-crown-subtitle { font-size: 1.15rem; line-height: 1.7; opacity: .9; max-width: 520px; }
        .queens-crown-visual { position: relative; display: flex; flex-direction: column; align-items: center; transform: translate3d(var(--queens-parallax-x), var(--queens-parallax-y), 0); }
        .queens-crown-logo { width: 100%; max-width: 460px; height: auto; filter: drop-shadow(0 24px 40px rgba(0,0,0,.35)); animation: queensLogoIn 1s cubic-bezier(.22,1,.36,1) both; }
        .queens-crown-bottle-wrap { position: relative; margin-top: -40px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .queens-crown-bottle { width: 100%; max-width: 300px; height: auto; filter: drop-shadow(0 28px 48px rgba(0,0,0,.35)) drop-shadow(0 0 32px rgba(255,140,0,.18)); animation: queensFloat 5s ease-in-out infinite; }
        .queens-crown-orbit { position: absolute; inset: -24px -48px auto; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; pointer-events: none; }
        .queens-orbit-chip { background: rgba(255,255,255,.9); color: #2a0f3a; border: 1px solid rgba(193,154,107,.6); border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 700; backdrop-filter: blur(6px); }
        .queens-crown-shop { position: relative; z-index: 2; }
        @keyframes queensLogoIn { from { opacity: 0; transform: scale(.94) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes queensFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @media (prefers-reduced-motion: reduce) { .queens-crown-logo, .queens-crown-bottle { animation: none; } }
      `}</style>
    </section>
  );
}
