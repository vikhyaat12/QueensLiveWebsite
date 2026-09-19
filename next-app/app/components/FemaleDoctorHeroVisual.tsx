"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   FemaleDoctorHeroVisual — Queens Care Healthcare Specialist Character
   Interactive brand character for the cinematic hero sequence.
   - Natural breathing / pose micro-motion (CSS sinusoidal animation)
   - Cursor gaze tracking (subtle eye/head shift responding to mouse position)
   - Interactive consultation badge / speech bubble triggering the Health Quiz
   - Support for custom image URL or rich vector illustration
   - Reduced-motion safe and responsive across mobile & desktop
   ═══════════════════════════════════════════════════════════════════════════ */

export type FemaleDoctorHeroVisualProps = {
  enabled?: boolean;
  position?: "split" | "left" | "right" | "center";
  size?: "sm" | "md" | "lg";
  animSpeed?: number;
  greeting?: string;
  subtext?: string;
  badgeText?: string;
  customImageUrl?: string;
  onOpenQuiz?: () => void;
  showSpeechBubble?: boolean;
  animationStyle?: "gentle_breathing" | "consultation" | "minimal" | "none";
};

export default function FemaleDoctorHeroVisual({
  enabled = true,
  position = "split",
  size = "md",
  animSpeed = 1,
  greeting = "Hi! I'm Dr. Queens 💙",
  subtext = "Let me help you find the right products for your needs. 💙",
  badgeText = "Clinical Formulation Specialist",
  customImageUrl = "/images/reference/dr-queens-hero.png",
  onOpenQuiz,
  showSpeechBubble = true,
  animationStyle = "gentle_breathing",
}: FemaleDoctorHeroVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Smooth mouse tracking for interactive gaze
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = (e.clientX - centerX) / (rect.width / 2);
    const dy = (e.clientY - centerY) / (rect.height / 2);
    setMouseOffset({
      x: Math.max(-1, Math.min(1, dx)),
      y: Math.max(-1, Math.min(1, dy)),
    });
  }, [reducedMotion]);

  const handleMouseLeave = useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  if (!enabled) return null;

  const sizeConfig = {
    sm: { width: 220, height: 280, bubbleWidth: 200 },
    md: { width: 280, height: 360, bubbleWidth: 240 },
    lg: { width: 340, height: 430, bubbleWidth: 280 },
  }[size] || { width: 280, height: 360, bubbleWidth: 240 };

  const eyeShiftX = mouseOffset.x * 2.5;
  const eyeShiftY = mouseOffset.y * 2.0;
  const headRotate = mouseOffset.x * 3.5;
  const headShiftX = mouseOffset.x * 4;

  const durationSec = 4 / Math.max(0.5, animSpeed);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="qc-hero-character-root"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        maxWidth: sizeConfig.width + 40,
        margin: "0 auto",
        userSelect: "none",
      }}
    >
      <style>{`
        @keyframes qcBreathingMotion {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-7px) scale(1.008);
          }
        }

        @keyframes qcAmbientAura {
          0%, 100% {
            opacity: 0.45;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.75;
            transform: scale(1.05);
          }
        }

        @keyframes qcBubbleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .qc-character-anim {
          animation: ${animationStyle === "none" || reducedMotion ? "none" : `qcBreathingMotion ${durationSec}s ease-in-out infinite`};
          transform-origin: bottom center;
          transition: transform 0.25s ease-out;
        }

        .qc-aura-glow {
          animation: ${reducedMotion ? "none" : "qcAmbientAura 6s ease-in-out infinite"};
        }

        .qc-speech-bubble {
          animation: ${reducedMotion ? "none" : "qcBubbleFloat 3s ease-in-out infinite"};
        }

        @media (max-width: 640px) {
          .qc-speech-bubble {
            display: none !important;
          }
        }
      `}</style>

      {/* Atmospheric Soft Aura Glow */}
      <div
        className="qc-aura-glow"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          right: "5%",
          bottom: "10%",
          background: "radial-gradient(circle at 50% 40%, rgba(212,175,55,0.18) 0%, rgba(42,15,58,0.08) 50%, transparent 75%)",
          filter: "blur(32px)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Floating Interactive Speech / Consultation Bubble Matching Reference */}
      {showSpeechBubble && (
        <div
          className="qc-speech-bubble"
          onClick={onOpenQuiz}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenQuiz?.();
            }
          }}
          style={{
            position: "absolute",
            top: -28,
            right: -20,
            zIndex: 10,
            maxWidth: 240,
            padding: "10px 16px",
            background: "rgba(255, 255, 255, 0.97)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 18,
            border: "1.5px solid #BAE6FD",
            boxShadow: isHovered
              ? "0 10px 28px rgba(2, 132, 199, 0.18)"
              : "0 6px 20px rgba(2, 132, 199, 0.12)",
            cursor: onOpenQuiz ? "pointer" : "default",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: isHovered ? "translateY(-3px) scale(1.03)" : "none",
          }}
        >
          {badgeText && badgeText !== "Clinical Specialist" && badgeText !== "BOARD-CERTIFIED CLINICAL SPECIALIST" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#0284C7",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", color: "#0284C7", textTransform: "uppercase" }}>
                {badgeText}
              </span>
            </div>
          )}
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1E293B", lineHeight: 1.3 }}>
            {greeting}
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#475569", lineHeight: 1.35 }}>
            {subtext}
          </p>
          {/* Subtle Speech Bubble Tail */}
          <div
            style={{
              position: "absolute",
              bottom: -7,
              left: 28,
              width: 12,
              height: 12,
              background: "#FFFFFF",
              borderRight: "1.5px solid #BAE6FD",
              borderBottom: "1.5px solid #BAE6FD",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      )}

      {/* Main Character Layer */}
      <div
        className="qc-character-anim"
        style={{
          position: "relative",
          width: sizeConfig.width,
          height: sizeConfig.height,
          zIndex: 2,
          filter: "drop-shadow(0 14px 28px rgba(42,15,58,0.12))",
        }}
      >
        {customImageUrl ? (
          <img
            src={customImageUrl}
            alt="Queens Care Healthcare Specialist"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transform: `translateX(${headShiftX * 0.5}px)`,
              transition: "transform 0.15s ease-out",
            }}
          />
        ) : (
          <svg
            viewBox="0 0 340 440"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "100%", height: "100%" }}
            aria-label="Queens Care Female Healthcare Specialist"
          >
            <defs>
              <linearGradient id="qcCoatGrad" x1="170" y1="180" x2="170" y2="440" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#F8F6F2" />
                <stop offset="100%" stopColor="#ECE6DC" />
              </linearGradient>
              <linearGradient id="qcGoldTrim" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F5E6A3" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#997A15" />
              </linearGradient>
              <linearGradient id="qcHairGrad" x1="170" y1="20" x2="170" y2="180" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2A1B14" />
                <stop offset="100%" stopColor="#190F0B" />
              </linearGradient>
              <linearGradient id="qcSkinGrad" x1="170" y1="80" x2="170" y2="180" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F7DFD0" />
                <stop offset="100%" stopColor="#E6C4B0" />
              </linearGradient>
              <filter id="qcSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#2A0F3A" floodOpacity="0.1" />
              </filter>
            </defs>

            {/* Ambient Base Shadow */}
            <ellipse cx="170" cy="425" rx="100" ry="14" fill="rgba(42,15,58,0.08)" filter="blur(4px)" />

            {/* Body / Lab Coat Group */}
            <g id="qc-coat-group">
              <path
                d="M100 230 C90 270 75 360 70 430 C120 436 220 436 270 430 C265 360 250 270 240 230 C220 215 195 210 170 210 C145 210 120 215 100 230 Z"
                fill="url(#qcCoatGrad)"
                stroke="#E2DDD5"
                strokeWidth="1.5"
                filter="url(#qcSoftShadow)"
              />

              <path d="M145 212 L170 260 L195 212 Z" fill="#3D194F" />
              <path d="M152 212 L170 252 L188 212 Z" fill="#52246A" />

              <path
                d="M125 215 L165 295 L145 380 L115 280 Z"
                fill="#FFFFFF"
                stroke="#E2DDD5"
                strokeWidth="1.2"
              />
              <path
                d="M215 215 L175 295 L195 380 L225 280 Z"
                fill="#FAF8F5"
                stroke="#E2DDD5"
                strokeWidth="1.2"
              />

              <line x1="170" y1="295" x2="170" y2="430" stroke="#E2DDD5" strokeWidth="1.5" />
              <circle cx="170" cy="320" r="3.5" fill="url(#qcGoldTrim)" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="170" cy="355" r="3.5" fill="url(#qcGoldTrim)" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="170" cy="390" r="3.5" fill="url(#qcGoldTrim)" stroke="#FFFFFF" strokeWidth="1" />

              {/* Specialist Gold Accreditation Badge */}
              <g transform="translate(195, 260)">
                <rect x="0" y="0" width="38" height="22" rx="3" fill="#FFFFFF" stroke="url(#qcGoldTrim)" strokeWidth="1.2" />
                <rect x="3" y="3" width="10" height="16" rx="2" fill="url(#qcGoldTrim)" />
                <circle cx="8" cy="8" r="2.5" fill="#FFFFFF" />
                <line x1="16" y1="7" x2="34" y2="7" stroke="#2A0F3A" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="16" y1="12" x2="30" y2="12" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="16" y1="16" x2="26" y2="16" stroke="url(#qcGoldTrim)" strokeWidth="1" strokeLinecap="round" />
              </g>

              {/* Elegant Gold Stethoscope */}
              <path
                d="M136 215 C136 265 142 305 160 325 C164 329 168 330 172 328"
                fill="none"
                stroke="url(#qcGoldTrim)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M204 215 C204 265 198 305 180 325 C176 329 172 330 168 328"
                fill="none"
                stroke="url(#qcGoldTrim)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="160" cy="328" r="7" fill="#FFFFFF" stroke="url(#qcGoldTrim)" strokeWidth="2" />
              <circle cx="160" cy="328" r="3" fill="url(#qcGoldTrim)" />
            </g>

            {/* Arms & Hands */}
            <path
              d="M100 230 C80 270 72 330 85 380 C88 392 102 392 108 380 C118 340 125 285 130 250"
              fill="#FFFFFF"
              stroke="#E2DDD5"
              strokeWidth="1.2"
            />
            <path
              d="M240 230 C260 265 268 320 255 365 C250 376 238 376 232 365 C222 330 215 280 210 250"
              fill="#FAF8F5"
              stroke="#E2DDD5"
              strokeWidth="1.2"
            />
            <g transform="translate(242, 345)">
              <ellipse cx="6" cy="18" rx="7" ry="10" fill="url(#qcSkinGrad)" />
              <rect x="8" y="10" width="10" height="22" rx="3" fill="#92400e" stroke="url(#qcGoldTrim)" strokeWidth="0.8" opacity="0.9" />
              <rect x="10" y="6" width="6" height="5" rx="1" fill="#FFFFFF" />
              <circle cx="13" cy="21" r="2" fill="#FDE047" opacity="0.8" />
            </g>

            {/* Interactive Head Group */}
            <g
              id="qc-head-group"
              style={{
                transform: `rotate(${headRotate}deg) translateX(${headShiftX}px)`,
                transformOrigin: "170px 180px",
                transition: "transform 0.12s ease-out",
              }}
            >
              <rect x="156" y="150" width="28" height="38" rx="8" fill="url(#qcSkinGrad)" />
              <path d="M156 170 Q170 182 184 170" fill="rgba(180,120,90,0.2)" />

              <ellipse cx="170" cy="122" rx="46" ry="52" fill="url(#qcSkinGrad)" />

              <path
                d="M120 120 C116 65 138 35 170 32 C202 35 224 65 220 120 C220 90 205 52 170 50 C135 52 120 90 120 120 Z"
                fill="url(#qcHairGrad)"
              />
              <ellipse cx="170" cy="30" rx="30" ry="20" fill="url(#qcHairGrad)" />
              <ellipse cx="170" cy="24" rx="20" ry="10" fill="#3D1E0F" opacity="0.6" />

              <path
                d="M122 100 Q145 65 175 75 Q195 82 215 108 C210 95 190 68 170 66 C145 68 126 88 122 100 Z"
                fill="#3D1E0F"
              />

              <path d="M142 104 Q152 99 162 103" fill="none" stroke="#2A1B14" strokeWidth="2" strokeLinecap="round" />
              <path d="M178 103 Q188 99 198 104" fill="none" stroke="#2A1B14" strokeWidth="2" strokeLinecap="round" />

              {/* Interactive Eyes */}
              <ellipse cx="152" cy="116" rx="6.5" ry="4.5" fill="#FFFFFF" />
              <circle cx={152 + eyeShiftX} cy={116 + eyeShiftY} r="3.2" fill="#2A170A" />
              <circle cx={151 + eyeShiftX * 0.8} cy={114.5 + eyeShiftY * 0.8} r="1.1" fill="#FFFFFF" />

              <ellipse cx="188" cy="116" rx="6.5" ry="4.5" fill="#FFFFFF" />
              <circle cx={188 + eyeShiftX} cy={116 + eyeShiftY} r="3.2" fill="#2A170A" />
              <circle cx={187 + eyeShiftX * 0.8} cy={114.5 + eyeShiftY * 0.8} r="1.1" fill="#FFFFFF" />

              <path d="M168 120 Q171 131 167 134 Q171 135 174 133" fill="none" stroke="#C8967E" strokeWidth="1.6" strokeLinecap="round" />

              <path
                d="M156 146 Q170 157 184 146"
                fill="none"
                stroke="#C05850"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path d="M162 147 Q170 151 178 147" fill="#FFFFFF" opacity="0.9" />

              <ellipse cx="140" cy="133" rx="10" ry="5.5" fill="rgba(224,120,105,0.22)" filter="blur(2px)" />
              <ellipse cx="200" cy="133" rx="10" ry="5.5" fill="rgba(224,120,105,0.22)" filter="blur(2px)" />

              <circle cx="123" cy="130" r="2.5" fill="url(#qcGoldTrim)" />
              <ellipse cx="123" cy="136" rx="2" ry="3.5" fill="#FFFFFF" stroke="url(#qcGoldTrim)" strokeWidth="0.8" />

              <circle cx="217" cy="130" r="2.5" fill="url(#qcGoldTrim)" />
              <ellipse cx="217" cy="136" rx="2" ry="3.5" fill="#FFFFFF" stroke="url(#qcGoldTrim)" strokeWidth="0.8" />
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
