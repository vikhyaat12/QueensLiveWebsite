"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import * as THREE from "three";
import Hero3DProductVisual from "./Hero3DProductVisual";

export type CinematicHeroStageProps = {
  onOpenQuiz?: () => void;
  productSlug?: string;
  productName?: string;
  productImage?: string;
  doctorImage?: string;
  mobileDoctorImage?: string;
  doctorSize?: number;
  doctorPositionX?: number;
  doctorPositionY?: number;
  doctorAnimEnabled?: boolean;
  doctorAnimIntensity?: number;
  parallaxAmount?: number;
  productScale?: number;
  productRotation?: number;
  productPositionX?: number;
  productPositionY?: number;
  product3DEnabled?: boolean;
  particleCanvasEnabled?: boolean;
  introAnimationEnabled?: boolean;
  idleAnimationEnabled?: boolean;
  speechBubbleEnabled?: boolean;
  floatingBenefits?: Array<{ id?: string; title?: string; label?: string; icon?: string; color?: string; x?: number; y?: number; visible?: boolean }>;
  brandSignature?: { text?: string; color?: string; font?: string; size?: number; visible?: boolean };
};

export default function CinematicHeroStage({
  onOpenQuiz,
  productSlug = "liko-q-suspension",
  productName = "Liko Q — Lycopene, Vitamins & Minerals",
  productImage = "/images/hero/likoq-hero-staged.webp",
  doctorImage = "/images/hero/dr-queens-hd.webp",
  mobileDoctorImage = "/images/hero/dr-queens-hd.webp",
  doctorSize = 1.0,
  doctorPositionX = 0,
  doctorPositionY = 0,
  doctorAnimEnabled = true,
  doctorAnimIntensity = 1.0,
  parallaxAmount = 14,
  productScale = 1.0,
  productRotation = 0,
  productPositionX = 0,
  productPositionY = 0,
  product3DEnabled = true,
  particleCanvasEnabled = true,
  introAnimationEnabled = true,
  idleAnimationEnabled = true,
  speechBubbleEnabled = true,
  floatingBenefits,
  brandSignature,
}: CinematicHeroStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check prefers-reduced-motion & mobile/tablet breakpoints
  useEffect(() => {
    const checkBreakpoints = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1024);
    };
    checkBreakpoints();
    window.addEventListener("resize", checkBreakpoints);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);

    return () => {
      window.removeEventListener("resize", checkBreakpoints);
      mq.removeEventListener("change", handler);
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // 5-PHASE CINEMATIC ENTRANCE SEQUENCE (7–10 seconds total)
  // Phase 1 (0–1.5s): Environment Awakens (gentle push-in, particles float)
  // Phase 2 (1.5–3.2s): Dr. Queens Comes Alive (breathing, authentic blink)
  // Phase 3 (3.2–5.4s): Dr. Queens Acknowledges Product (head/gaze turn, pointing gesture)
  // Phase 4 (5.4–7.5s): Product Reveal (specular light sheen, golden orbs orbit, badges reveal)
  // Phase 5 (7.5–9.8s): Dr. Queens Speaks (smooth speech bubble spring pop-in)
  // Infinite Idle (9.8s+): Subdued, natural breathing & micro-movements
  // ═══════════════════════════════════════════════════════════════════════
  type IntroPhase = "awaken" | "alive" | "acknowledge" | "reveal" | "speak" | "idle";
  const [introPhase, setIntroPhase] = useState<IntroPhase>(() =>
    reducedMotion || !introAnimationEnabled ? "idle" : "awaken"
  );
  const [showSpeechBubble, setShowSpeechBubble] = useState<boolean>(() =>
    reducedMotion || !introAnimationEnabled
  );

  useEffect(() => {
    if (reducedMotion || !introAnimationEnabled) {
      setIntroPhase("idle");
      setShowSpeechBubble(true);
      return;
    }

    setIntroPhase("awaken");

    const t2 = setTimeout(() => {
      setIntroPhase("alive");
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);
    }, 1500);

    const t3 = setTimeout(() => {
      setIntroPhase("acknowledge");
    }, 3200);

    const t4 = setTimeout(() => {
      setIntroPhase("reveal");
    }, 5400);

    const t5 = setTimeout(() => {
      setIntroPhase("speak");
      setShowSpeechBubble(true);
    }, 7500);

    const t6 = setTimeout(() => {
      setIntroPhase("idle");
    }, 9800);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [reducedMotion, introAnimationEnabled]);

  // Lifelike Eye Blinking Loop for Dr. Queens
  useEffect(() => {
    if (reducedMotion || !doctorAnimEnabled) return;

    let timeoutId: NodeJS.Timeout;
    const scheduleNextBlink = () => {
      // Natural eye blinking: every 3.2 to 4.8 seconds
      const delay = 3200 + Math.random() * 1600;
      timeoutId = setTimeout(() => {
        setIsBlinking(true);
        // Human blink duration: ~140ms
        setTimeout(() => {
          setIsBlinking(false);
          // 20% chance of an authentic double-blink
          if (Math.random() < 0.22) {
            setTimeout(() => {
              setIsBlinking(true);
              setTimeout(() => {
                setIsBlinking(false);
                scheduleNextBlink();
              }, 120);
            }, 100);
          } else {
            scheduleNextBlink();
          }
        }, 140);
      }, delay);
    };

    scheduleNextBlink();
    return () => clearTimeout(timeoutId);
  }, [reducedMotion, doctorAnimEnabled]);

  // Dr. Queens Idle Movement Loop:
  type ActivityState = "idle" | "look" | "gesture" | "tablet" | "return";
  const [activityState, setActivityState] = useState<ActivityState>("idle");

  useEffect(() => {
    if (reducedMotion || !doctorAnimEnabled || !idleAnimationEnabled) return;
    if (introPhase !== "idle") return; // Let entrance sequence complete first

    const schedule: { state: ActivityState; duration: number }[] = [
      { state: "idle", duration: 5200 },
      { state: "look", duration: 2800 },
      { state: "gesture", duration: 3200 },
      { state: "tablet", duration: 2600 },
      { state: "return", duration: 1600 },
    ];

    let currentIndex = 0;
    let timer: NodeJS.Timeout;

    const advance = () => {
      const current = schedule[currentIndex];
      setActivityState(current.state);
      timer = setTimeout(() => {
        currentIndex = (currentIndex + 1) % schedule.length;
        advance();
      }, current.duration);
    };

    advance();
    return () => clearTimeout(timer);
  }, [reducedMotion, doctorAnimEnabled, idleAnimationEnabled, introPhase]);

  // Three.js Ambient Sparkling Particles & Light Field
  useEffect(() => {
    if (reducedMotion || !particleCanvasEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth || 680;
    const height = canvas.clientHeight || 520;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 5;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    } catch {
      return;
    }

    // Micro sparkling particles (Gold & Violet & Amber)
    const particleCount = 36;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const goldColor = new THREE.Color("#D4AF37");
    const purpleColor = new THREE.Color("#8B5CF6");
    const amberColor = new THREE.Color("#F59E0B");

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

      const col = i % 3 === 0 ? goldColor : i % 3 === 1 ? purpleColor : amberColor;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let frameId = 0;
    const startTime = performance.now();
    let isVisible = true;

    const animate = () => {
      if (!isVisible) return;
      const elapsed = (performance.now() - startTime) * 0.001;
      points.rotation.y = elapsed * 0.04;
      points.rotation.x = Math.sin(elapsed * 0.03) * 0.06;

      renderer?.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const visible = entry ? entry.isIntersecting : true;
          if (visible && !isVisible) {
            isVisible = true;
            animate();
          } else if (!visible && isVisible) {
            isVisible = false;
            cancelAnimationFrame(frameId);
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(canvas);
    }

    animate();

    const handleResize = () => {
      if (!canvas) return;
      const w = canvas.clientWidth || 680;
      const h = canvas.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer?.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (observer) observer.disconnect();
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer?.dispose();
    };
  }, [reducedMotion, particleCanvasEnabled]);

  // Smooth mouse and touch tracking
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMouse({
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      });
    },
    [reducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    setMouse({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  // Window mousemove tracking for hero section area (desktop mouse only, zero tracking on touch devices)
  useEffect(() => {
    if (reducedMotion) return;
    const onWindowMove = (e: MouseEvent) => {
      // Strictly disabled on touch/mobile/tablet devices
      if (typeof window !== "undefined" && window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        setMouse({
          x: Math.max(-1, Math.min(1, x)),
          y: Math.max(-1, Math.min(1, y)),
        });
        setIsHovered(true);
      } else if (isHovered) {
        setIsHovered(false);
      }
    };
    window.addEventListener("mousemove", onWindowMove, { passive: true });
    return () => window.removeEventListener("mousemove", onWindowMove);
  }, [reducedMotion, isHovered]);

  // Intensity factor
  const intensity = doctorAnimIntensity || 1.0;
  const pFactor = parallaxAmount || 14;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="cinematic-hero-stage-root"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        height: "100%",
        minHeight: isMobile ? 400 : isTablet ? 600 : 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        perspective: 1400,
        overflow: "visible",
      }}
    >
      <style>{`
        /* Breathing cycle for Dr. Queens */
        @keyframes docBreathingCycle {
          0%, 100% {
            transform: translateY(0px) scale(1) rotate(0deg);
          }
          50% {
            transform: translateY(-7px) scale(1.01) rotate(0.35deg);
          }
        }

        /* Subtle tablet & arm gesture sway */
        @keyframes tabletSway {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(-1.2deg) translateY(-4px); }
        }

        /* 2.5D Product Bottle Floating */
        @keyframes bottleFloatCycle {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(1.2deg);
          }
        }

        /* Specular Light Reflection Sheen Sweep */
        @keyframes specularSheen {
          0% { transform: translateX(-150%) rotate(25deg); opacity: 0; }
          20% { opacity: 0.7; }
          60% { transform: translateX(180%) rotate(25deg); opacity: 0.7; }
          100% { transform: translateX(200%) rotate(25deg); opacity: 0; }
        }

        /* Speech bubble floating bounce */
        @keyframes speechBubbleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        /* Spring pop-in for speech bubble entrance */
        @keyframes springPopIn {
          0% { opacity: 0; transform: translateY(16px) scale(0.85); }
          60% { opacity: 1; transform: translateY(-4px) scale(1.03); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Hologram UI badge float */
        @keyframes badgeFloatA {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes badgeFloatB {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        /* Orbiting golden vitamin particles */
        @keyframes orbitA {
          0% { transform: rotate(0deg) translateX(95px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(95px) rotate(-360deg); }
        }
        @keyframes orbitB {
          0% { transform: rotate(180deg) translateX(115px) rotate(-180deg); }
          100% { transform: rotate(540deg) translateX(115px) rotate(-540deg); }
        }

        /* Subtle cursive script shimmer */
        @keyframes cursivePulse {
          0%, 100% { opacity: 0.92; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }

        .hero-doc-alive {
          animation: ${reducedMotion || !doctorAnimEnabled ? "none" : `docBreathingCycle ${4.6 / intensity}s ease-in-out infinite`};
          transform-origin: bottom center;
          transition: transform 0.35s cubic-bezier(0.2, 0, 0.2, 1);
        }

        .hero-bottle-alive {
          animation: ${reducedMotion || !product3DEnabled ? "none" : `bottleFloatCycle ${5.4 / intensity}s ease-in-out infinite`};
          transform-origin: center center;
          transition: transform 0.35s cubic-bezier(0.2, 0, 0.2, 1);
        }

        .hero-sheen-sweep {
          animation: ${reducedMotion ? "none" : "specularSheen 6.5s cubic-bezier(0.4, 0, 0.2, 1) infinite 1.5s"};
        }

        .hero-speech-bubble-alive {
          animation: ${reducedMotion ? "none" : "speechBubbleBounce 3.6s ease-in-out infinite"};
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (max-width: 992px) {
          .hero-floating-pill-stack,
          .hero-cursive-tagline {
            display: none !important;
          }
        }
      `}</style>

      {/* Layer 0: Three.js Particles Canvas */}
      {particleCanvasEnabled && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1,
            opacity: introPhase === "awaken" ? 0.3 : 0.9,
            transition: "opacity 1.2s ease",
          }}
        />
      )}

      {/* Layer 1: Ambient Sunlit & Botanical Glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "10%",
          left: "25%",
          right: "5%",
          bottom: "10%",
          background: "radial-gradient(circle at 65% 45%, rgba(212,175,55,0.22) 0%, rgba(139,92,246,0.12) 45%, transparent 75%)",
          filter: "blur(50px)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 0,
          transform: `translate(${mouse.x * (pFactor * 0.4)}px, ${mouse.y * (pFactor * 0.4)}px)`,
          transition: "transform 0.3s ease-out",
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════
          PANORAMIC 2.5D STAGE: DR. QUEENS (CENTER-LEFT) & PRODUCT (RIGHT)
          Dr. Queens' face is NEVER covered by the bottle.
          ═══════════════════════════════════════════════════════════════ */}
      {(() => {
        let addRotY = 0;
        let addRotX = 0;
        let addRotZ = 0;
        let addTransX = 0;
        let addTransY = 0;
        let tabletGlow = false;
        let speechHighlight = false;

        // Sequence phase driven poses
        if (introPhase === "acknowledge") {
          addRotY = 5.5 * intensity;
          addTransX = 6 * intensity;
          addTransY = -4 * intensity;
          tabletGlow = true;
        } else if (introPhase === "reveal") {
          addRotY = 4.5 * intensity;
          addTransX = 5 * intensity;
          addTransY = -3 * intensity;
          tabletGlow = true;
        } else if (introPhase === "speak") {
          addRotY = 0;
          speechHighlight = true;
        } else if (introPhase === "idle") {
          // Continuous subtle idle activity loop
          if (activityState === "look") {
            addRotY = 5.0 * intensity;
            addTransX = 5 * intensity;
            speechHighlight = true;
          } else if (activityState === "gesture") {
            addRotY = 6.5 * intensity;
            addRotZ = -1.2 * intensity;
            addTransY = -6 * intensity;
            addTransX = 7 * intensity;
            speechHighlight = true;
          } else if (activityState === "tablet") {
            addRotX = 3.5 * intensity;
            addRotY = 1.5 * intensity;
            addTransY = -3 * intensity;
            tabletGlow = true;
          } else if (activityState === "return") {
            addRotY = 1.5 * intensity;
          }
        }

        // Camera push-in for Phase 1
        const cameraScale = introPhase === "awaken" ? 1.025 : 1.0;

        return (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: isMobile ? 380 : isTablet ? 580 : 680,
              overflow: "visible",
              background: "transparent",
              transformStyle: "preserve-3d",
              transform: `scale(${cameraScale}) rotateY(${mouse.x * 2.0}deg) rotateX(${-mouse.y * 2.0}deg)`,
              transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
              zIndex: 2,
            }}
          >
            {/* ─────────────────────────────────────────────────────────────
                LAYER 2: DR. QUEENS CHARACTER (CENTER-LEFT / CENTER)
                Face, smile, stethoscope, and tablet are 100% CLEAR.
                ───────────────────────────────────────────────────────────── */}
            <div
              className="hero-doc-alive"
              style={{
                position: "absolute",
                bottom: -4 + doctorPositionY,
                left: isMobile
                  ? "-4px"
                  : isTablet
                  ? `${26 + doctorPositionX}%`
                  : `${33 + doctorPositionX}%`,
                width: isMobile ? 240 : isTablet ? 420 : 530,
                height: isMobile ? 360 : isTablet ? 560 : 700,
                transformOrigin: "bottom center",
                transform: `scale(${doctorSize}) translate(${mouse.x * (pFactor * 0.7) + addTransX}px, ${mouse.y * (pFactor * 0.5) + addTransY}px) rotateY(${mouse.x * 4 * intensity + addRotY}deg) rotateX(${-mouse.y * 2.5 + addRotX}deg) rotateZ(${addRotZ}deg)`,
                transition: "transform 0.85s cubic-bezier(0.25, 1, 0.5, 1)",
                zIndex: 4,
                pointerEvents: "none",
              }}
            >
              {/* Dr. Queens Base Character — approved cutout; CSS media query swaps to the
                  lightweight portrait variant on mobile without any JS or hydration flash */}
              <picture>
                {mobileDoctorImage && (
                  <source
                    media="(max-width: 767px)"
                    srcSet={mobileDoctorImage}
                    type={mobileDoctorImage.endsWith(".webp") ? "image/webp" : undefined}
                  />
                )}
                <source srcSet={doctorImage} type="image/webp" />
                <img
                  src={doctorImage.replace(".webp", ".png")}
                  alt="Dr. Queens — Health Specialist"
                  fetchPriority="high"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    objectPosition: "bottom center",
                    filter: "drop-shadow(0 14px 28px rgba(30, 22, 56, 0.16))",
                    display: "block",
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/images/reference/dr-queens-hero.png";
                  }}
                />
              </picture>

              {/* Dr. Queens Natural Full-Character Blink Layer (desktop-only decorative layer) */}
              {!isMobile && (
              <picture>
                <source srcSet="/images/hero/dr-queens-blink-hd.webp" type="image/webp" />
                <img
                  src="/images/hero/dr-queens-blink-hd.png"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    objectPosition: "bottom center",
                    opacity: isBlinking ? 1 : 0,
                    transition: "opacity 0.05s ease",
                    pointerEvents: "none",
                  }}
                />
              </picture>
              )}

              {/* Holographic Clinic Tablet Screen Pulse */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  bottom: isMobile ? "20%" : "22%",
                  left: isMobile ? "44%" : "46%",
                  width: isMobile ? 85 : 150,
                  height: isMobile ? 55 : 105,
                  borderRadius: 14,
                  background: "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.42) 0%, rgba(56, 189, 248, 0.24) 55%, transparent 75%)",
                  filter: "blur(7px)",
                  opacity: tabletGlow ? 1 : 0,
                  transform: tabletGlow ? "scale(1.15)" : "scale(0.85)",
                  transition: "opacity 0.6s ease, transform 0.6s ease",
                  pointerEvents: "none",
                  zIndex: 6,
                }}
              />
            </div>

            {/* ─────────────────────────────────────────────────────────────
                LAYER 3: ORIGINAL IMMUNE SUPPORT+ BOTTLE (RIGHT SIDE)
                Positioned beside Dr. Queens. NEVER covers her face.
                ───────────────────────────────────────────────────────────── */}
            <div
              className="hero-bottle-alive"
              style={{
                position: "absolute",
                bottom: (isMobile ? 8 : isTablet ? 14 : 16) + productPositionY,
                right: isMobile
                  ? "2px"
                  : isTablet
                  ? `${2 - productPositionX}%`
                  : `${4 - productPositionX}%`,
                width: isMobile ? 180 : isTablet ? 340 : 450,
                height: isMobile ? 240 : isTablet ? 420 : 550,
                transformStyle: "preserve-3d",
                transform: `scale(${productScale}) translate(${mouse.x * (pFactor * -0.9)}px, ${mouse.y * (pFactor * -0.7)}px) rotateY(${mouse.x * 10 + productRotation}deg) rotateX(${-mouse.y * 8}deg)`,
                zIndex: 5,
                cursor: "pointer",
                transition: "opacity 0.8s ease, transform 0.4s ease-out",
              }}
            >
              {/* Orbiting 3D Golden Vitamin Orbs */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "38%",
                  left: "44%",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, #FDE68A 0%, #D97706 80%)",
                  boxShadow: "0 0 16px rgba(245, 158, 11, 0.8)",
                  animation: reducedMotion ? "none" : "orbitA 7s linear infinite",
                  pointerEvents: "none",
                  zIndex: 7,
                }}
              />
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "54%",
                  left: "44%",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, #FDE68A 0%, #B45309 80%)",
                  boxShadow: "0 0 14px rgba(217, 119, 6, 0.7)",
                  animation: reducedMotion ? "none" : "orbitB 9s linear infinite",
                  pointerEvents: "none",
                  zIndex: 3,
                }}
              />

              {/* Original LikoQ / Queens Care Product Bottle */}
              <div style={{ position: "relative", width: "100%", height: "100%", overflow: "visible" }}>
                {/* Soft halo + ground shadow so a real product photo sits naturally in the scene */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: "82%",
                    height: "78%",
                    transform: "translate(-50%, -50%)",
                    background: "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(237,233,254,0.45) 55%, transparent 75%)",
                    filter: "blur(6px)",
                    borderRadius: "50%",
                    pointerEvents: "none",
                    zIndex: 0,
                  }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: "-2%",
                    width: "70%",
                    height: 26,
                    transform: "translateX(-50%)",
                    background: "radial-gradient(ellipse at center, rgba(30,22,56,0.22) 0%, transparent 70%)",
                    filter: "blur(8px)",
                    pointerEvents: "none",
                    zIndex: 0,
                  }}
                />
                {product3DEnabled && !isMobile && !reducedMotion ? (
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      pointerEvents: "auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2,
                    }}
                  >
                    <Hero3DProductVisual
                      productName={productName}
                      scale={productScale * 0.9}
                      autoRotate={true}
                      rotationSpeed={0.7}
                      mouseInteraction={true}
                      lightingIntensity={1.5}
                      accentColor="#D4AF37"
                      bgEffect="transparent"
                      height="100%"
                      showInfoPlate={false}
                    />
                  </div>
                ) : productImage.endsWith(".webp") ? (
                  <picture>
                    <source srcSet={productImage} type="image/webp" />
                    <img
                      src={productImage.replace(".webp", ".png")}
                      alt={`${productName} — Flagship Formulation`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        filter: "drop-shadow(0 18px 36px rgba(30, 22, 56, 0.2))",
                        display: "block",
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/images/reference/hero-product-bottle-hd.png";
                      }}
                    />
                  </picture>
                ) : (
                  <img
                    src={productImage}
                    alt={`${productName} — Flagship Formulation`}
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      filter: "drop-shadow(0 18px 36px rgba(30, 22, 56, 0.18))",
                      display: "block",
                      zIndex: 1,
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/reference/hero-product-bottle-hd.png";
                    }}
                  />
                )}

                {/* Specular Light Reflection Sheen */}
                <div
                  className="hero-sheen-sweep"
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "60%",
                    height: "100%",
                    background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.45) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.45) 55%, transparent 80%)",
                    pointerEvents: "none",
                    zIndex: 6,
                  }}
                />
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                LAYER 4: DR. QUEENS SPEECH BUBBLE (ATTACHED OVER HER HEAD)
                ───────────────────────────────────────────────────────────── */}
            {showSpeechBubble && speechBubbleEnabled !== false && (
              <div
                className="hero-speech-bubble-alive"
                style={{
                  position: "absolute",
                  top: isMobile ? "3%" : isTablet ? "5%" : "7%",
                  left: isMobile ? "4%" : isTablet ? "32%" : "39%",
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(12px)",
                  border: "1.5px solid #8B5CF6",
                  borderRadius: 20,
                  padding: isMobile ? "8px 12px" : "10px 16px",
                  boxShadow: speechHighlight
                    ? "0 14px 34px rgba(139, 92, 246, 0.32), 0 0 20px rgba(193, 154, 107, 0.25)"
                    : "0 8px 24px rgba(139, 92, 246, 0.18)",
                  zIndex: 8,
                  maxWidth: isMobile ? 220 : 250,
                  cursor: "pointer",
                  pointerEvents: "auto",
                  transform: `translate(${mouse.x * 5}px, ${mouse.y * 3}px) scale(${speechHighlight ? 1.04 : 1})`,
                  animation: introPhase === "speak" ? "springPopIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)" : undefined,
                  transition: "transform 0.4s ease, box-shadow 0.4s ease",
                }}
                onClick={onOpenQuiz}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onOpenQuiz?.();
                }}
                aria-label="Consult Dr. Queens — Take Health Quiz"
              >
                <div style={{ fontSize: isMobile ? 11.5 : 12.5, fontWeight: 800, color: "#5B21B6", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>Dr. Queens · Care Guide</span>
                </div>
                <div className="hero-speech-bubble-text" style={{ fontSize: isMobile ? 10.5 : 11, color: "#334155", lineHeight: 1.35, fontWeight: 500 }}>
                  Take our 2-min assessment for tailored formulation guidance.
                </div>
                {/* Speech Bubble Arrow pointing to Dr. Queens */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -7,
                    left: 28,
                    width: 14,
                    height: 14,
                    background: "#FFFFFF",
                    borderRight: "1.5px solid #8B5CF6",
                    borderBottom: "1.5px solid #8B5CF6",
                    transform: "rotate(45deg)",
                  }}
                />
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                LAYER 5: FLOATING HOLOGRAPHIC BADGES & CURSIVE SCRIPT
                Positioned in open sunlight on upper right. CMS-controlled.
                ───────────────────────────────────────────────────────────── */}
            {(() => {
              const defaultPills = [
                { label: "Stronger Immunity", icon: "🛡️", color: "#0284C7", anim: "badgeFloatA" },
                { label: "More Energy", icon: "⚡", color: "#059669", anim: "badgeFloatB" },
                { label: "Everyday Wellness", icon: "💜", color: "#7C3AED", anim: "badgeFloatA" },
              ];
              const pills = Array.isArray(floatingBenefits) && floatingBenefits.length > 0
                ? floatingBenefits.filter(b => b.visible !== false).map((b, i) => ({
                    label: b.title || b.label || defaultPills[i % 3].label,
                    icon: b.icon || defaultPills[i % 3].icon,
                    color: b.color || defaultPills[i % 3].color,
                    anim: i % 2 === 0 ? "badgeFloatA" : "badgeFloatB",
                  }))
                : defaultPills;

              return (
                <div
                  className="hero-floating-pill-stack"
                  style={{
                    position: "absolute",
                    top: "8%",
                    right: "5%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    zIndex: 6,
                    pointerEvents: "none",
                    transform: `translate(${mouse.x * -5}px, ${mouse.y * -3}px)`,
                    opacity: introPhase === "awaken" ? 0 : 1,
                    transition: "opacity 1.0s ease 0.4s",
                  }}
                >
                  {pills.map((pill, pi) => (
                    <div
                      key={pi}
                      style={{
                        background: "rgba(255, 255, 255, 0.94)",
                        backdropFilter: "blur(10px)",
                        border: `1px solid ${pill.color}40`,
                        borderRadius: 999,
                        padding: "6px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: `0 6px 16px ${pill.color}18`,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#1E293B",
                        animation: reducedMotion ? "none" : `${pill.anim} ${3.6 + pi * 0.4}s ease-in-out infinite ${pi * 0.25}s`,
                      }}
                    >
                      <span>{pill.icon}</span>
                      <span>{pill.label}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Cursive Tagline from Reference Image: "Care Today Brighter Tomorrows 💖" */}
            {brandSignature?.visible !== false && (
              <div
                className="hero-cursive-tagline"
                style={{
                  position: "absolute",
                  top: "29%",
                  right: "5.5%",
                  zIndex: 6,
                  pointerEvents: "none",
                  fontFamily: brandSignature?.font || "var(--font-cursive, 'Dancing Script', 'Caveat', 'Playfair Display', cursive, serif)",
                  fontSize: brandSignature?.size || 20,
                  fontWeight: 700,
                  fontStyle: "italic",
                  color: brandSignature?.color || "#BE185D",
                  textShadow: "0 2px 10px rgba(255, 255, 255, 0.8)",
                  transform: `translate(${mouse.x * -3}px, ${mouse.y * -2}px) rotate(3deg)`,
                  opacity: introPhase === "awaken" ? 0 : 0.95,
                  transition: "opacity 1.0s ease 0.6s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  lineHeight: 1.2,
                }}
              >
                {brandSignature?.text ? (
                  brandSignature.text.split("\n").map((line, li) => (
                    <span key={li}>{line}</span>
                  ))
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                    <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6D28D9", fontWeight: 800, fontFamily: "var(--font-geist, sans-serif)" }}>
                      ✦ Clinical Integrity
                    </span>
                    <span style={{ fontSize: 14, fontFamily: "var(--font-display, serif)", color: "#1E1638", fontStyle: "italic", fontWeight: 600 }}>
                      Pharmaceutical Rigor
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                CLICK TARGETS (POINTED AT ACTIVE ZONES, PRESERVES LEFT COPY)
                ───────────────────────────────────────────────────────────── */}
            {/* Center Click Zone: Doctor & Quiz Trigger */}
            <button
              type="button"
              onClick={onOpenQuiz}
              title="Consult Dr. Queens — Take Health Quiz"
              aria-label="Consult Dr. Queens — Take Health Quiz"
              style={{
                position: "absolute",
                top: "10%",
                left: isMobile ? "0%" : isTablet ? "28%" : "35%",
                width: isMobile ? "50%" : "32%",
                height: "85%",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                zIndex: 7,
                pointerEvents: "auto",
              }}
            />

            {/* Right Click Zone: Product Link to PDP */}
            <Link
              href={`/products/${productSlug}`}
              title={`View ${productName}`}
              aria-label={`View ${productName}`}
              style={{
                position: "absolute",
                top: "15%",
                right: isMobile ? "0%" : "2%",
                width: isMobile ? "48%" : "32%",
                height: "80%",
                background: "transparent",
                cursor: "pointer",
                zIndex: 7,
                pointerEvents: "auto",
              }}
            />
          </div>
        );
      })()}
    </div>
  );
}
