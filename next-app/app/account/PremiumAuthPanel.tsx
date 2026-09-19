"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import BrandLogo from "../components/BrandLogo";
import DoctorCinematicScene, { DoctorCinematicConfig, DoctorCinematicHandle } from "../components/DoctorCinematicScene";

/* ═══════════════════════════════════════════════════════════════
   PremiumAuthPanel — Queens Care Laboratories
   Premium two-column authentication experience with the cinematic
   doctor entrance video asset.

   Layout zones:
   ┌───────────────────────────┬───────────────────────────┐
   │  DOCTOR STAGE (col 1)     │  LOGIN STAGE (col 2)      │
   │  character + medical bag  │  greeting + login card    │
   └───────────────────────────┴───────────────────────────┘

   • Doctor stage: Complete, uncropped 16:9 doctor animation
     with Queens Care branded medical bag.
   • Login stage: Outlined rounded frame containing the real
     interactive React/HTML authentication panel.
   • The login card is strictly INSIDE the right frame with
     comfortable internal padding on all sides.
   • Reveal timing: The login card remains hidden while the
     doctor enters, places the bag, and bag glows. It appears
     ONLY after the doctor completes the welcoming hand gesture
     toward the right side (~7.5s).
   • Exactly one doctor, one bag, one login card.
   • All auth logic passed in via props (zero auth changes).
   ═══════════════════════════════════════════════════════════════ */

export type PremiumAuthPanelProps = {
  authTab: "login" | "register";
  setAuthTab: (t: "login" | "register") => void;
  authForm: AuthFormData;
  setAuthForm: (f: AuthFormData) => void;
  authMessage: string;
  authLoading: boolean;
  forgotMode: boolean;
  setForgotMode: (v: boolean) => void;
  handleLogin: (e: React.FormEvent) => void;
  handleRegister: (e: React.FormEvent) => void;
  handleForgot: (e: React.FormEvent) => void;
  queryError: string | null;
  authSuccess?: boolean;
};

export type AuthFormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  rememberMe: boolean;
};

type LoginExperienceSettings = {
  scene: DoctorCinematicConfig;
  bgStyle: "aurora" | "plain";
  bgImage: string;
  heading: string;
  subheading: string;
  ctaLabel: string;
  successMessage: string;
  trustItems: string[];
};

const DEFAULT_LOGIN_SETTINGS: LoginExperienceSettings = {
  scene: {
    enabled: true,
    assetUrl: "",
    size: "md",
    position: "left",
    entranceEnabled: true,
    walkEnabled: true,
    bagAnimationEnabled: true,
    revealEnabled: true,
    animationEnabled: true,
    speed: 1,
    intensity: 1,
    bagEnabled: true,
    bagAssetUrl: "",
    coatLogoUrl: "",
    bagLogoUrl: "/uploads/logos/queens-care-horizontal-white.png",
  },
  bgStyle: "aurora",
  bgImage: "",
  heading: "Welcome back",
  subheading: "Your health is our highest mission.",
  ctaLabel: "Sign in",
  successMessage: "Welcome to your care account",
  trustItems: ["Personalized Wellness", "256-Bit Encrypted", "Verified Care Team"],
};

function parseLoginSettings(settings: Array<{ key: string; value: unknown }>): LoginExperienceSettings {
  const map = new Map(settings.map((s) => [String(s.key), s.value]));
  const str = (k: string, d = "") => {
    const v = map.get(k);
    return v === undefined || v === null || v === "" ? d : String(v);
  };
  const bool = (k: string, d: boolean) => {
    const v = map.get(k);
    return v === undefined || v === null || v === "" ? d : String(v) === "true";
  };
  const num = (k: string, d: number, lo: number, hi: number) => {
    const v = Number(map.get(k));
    return Number.isFinite(v) && v !== 0 ? Math.min(hi, Math.max(lo, v)) : d;
  };
  return {
    scene: {
      enabled: bool("login_doctor_enabled", true),
      assetUrl: str("login_doctor_asset"),
      size: (["sm", "md", "lg"].includes(str("login_doctor_size")) ? str("login_doctor_size") : "md") as DoctorCinematicConfig["size"],
      position: (["left", "center", "right"].includes(str("login_doctor_position")) ? str("login_doctor_position") : "left") as DoctorCinematicConfig["position"],
      entranceEnabled: bool("login_entrance_enabled", true),
      walkEnabled: bool("login_walk_enabled", true),
      bagAnimationEnabled: bool("login_bag_animation_enabled", true),
      revealEnabled: bool("login_reveal_enabled", true),
      animationEnabled: bool("login_animation_enabled", true),
      speed: num("login_animation_speed", 1, 0.6, 1.6),
      intensity: num("login_animation_intensity", 1, 0.6, 1.4),
      bagEnabled: bool("login_bag_enabled", true),
      bagAssetUrl: str("login_bag_asset"),
      coatLogoUrl: str("login_coat_logo"),
      bagLogoUrl: str("login_bag_logo", DEFAULT_LOGIN_SETTINGS.scene.bagLogoUrl),
    },
    bgStyle: str("login_bg_style", "aurora") === "plain" ? "plain" : "aurora",
    bgImage: str("login_bg_image"),
    heading: str("login_heading", DEFAULT_LOGIN_SETTINGS.heading),
    subheading: str("login_subheading", DEFAULT_LOGIN_SETTINGS.subheading),
    ctaLabel: str("login_cta_label", DEFAULT_LOGIN_SETTINGS.ctaLabel),
    successMessage: str("login_success_message", DEFAULT_LOGIN_SETTINGS.successMessage),
    trustItems: str("login_trust_items", "Personalized Wellness • 256-Bit Encrypted • Verified Care Team")
      .split(/[•|,]/)
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

function isErrorMsg(msg: string) {
  return msg.includes("error") || msg.includes("Error") || msg.includes("Failed") || msg.includes("Invalid") || msg.includes("already");
}

export default function PremiumAuthPanel({
  authTab,
  setAuthTab,
  authForm,
  setAuthForm,
  authMessage,
  authLoading,
  forgotMode,
  setForgotMode,
  handleLogin,
  handleRegister,
  handleForgot,
  queryError,
  authSuccess,
}: PremiumAuthPanelProps) {
  const sceneRef = useRef<DoctorCinematicHandle>(null);
  const [reducedMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [loginSettings, setLoginSettings] = useState<LoginExperienceSettings | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [formFocus, setFormFocus] = useState<"email" | "password" | "name" | null>(null);

  /* Fetch CMS settings with 1.5s fallback */
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => { if (!cancelled) setLoginSettings(DEFAULT_LOGIN_SETTINGS); }, 1500);
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        clearTimeout(timeout);
        setLoginSettings(parseLoginSettings(d.settings || []));
      })
      .catch(() => { if (!cancelled) { clearTimeout(timeout); setLoginSettings(DEFAULT_LOGIN_SETTINGS); } });
    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  /* Auth success state */
  useEffect(() => {
    if (authSuccess) setCelebrate(true);
  }, [authSuccess]);

  const cfg = loginSettings || DEFAULT_LOGIN_SETTINGS;
  const entranceWillPlay = Boolean(cfg.scene.enabled && cfg.scene.entranceEnabled && !reducedMotion);

  /* Instant settle on any keystroke or tap — account access is never blocked */
  useLayoutEffect(() => {
    if (!entranceWillPlay) return;
    const skip = () => {
      sceneRef.current?.skipToIdle();
      setRevealed(true);
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip, { passive: true });
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [entranceWillPlay]);

  /* Fallback: reveal card when entrance isn't playing */
  useEffect(() => {
    if (loginSettings && !entranceWillPlay) {
      setRevealed(true);
    }
  }, [loginSettings, entranceWillPlay]);

  /* Smooth reveal handler called by DoctorCinematicScene */
  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  /* Dynamic contextual greeting */
  const greeting = celebrate
    ? { heading: cfg.successMessage, sub: "Taking you to your account…" }
    : authLoading
    ? { heading: "Verifying your details", sub: "One moment — checking your credentials." }
    : authMessage && isErrorMsg(authMessage)
    ? { heading: "Let's try again", sub: "Please double-check your sign-in details." }
    : forgotMode
    ? { heading: "Password recovery", sub: "We'll email you a secure reset link." }
    : authTab === "register"
    ? { heading: "Create your account", sub: "Personal care, tailored for you." }
    : { heading: cfg.heading, sub: cfg.subheading };

  const ctaLabel = authTab === "login" ? (cfg.ctaLabel || "Sign in") : "Create account";

  return (
    <>
      <style>{`
        .qc-auth-viewport {
          position: relative;
          width: 100vw;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #150625;
          overflow-x: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #2A0F3A;
        }

        /* ══ DESKTOP STAGE (>= 1024px): 16:9 canvas preserving full video ══ */
        @media (min-width: 1024px) {
          .qc-stage-canvas {
            position: relative;
            width: min(100vw, calc(100vh * 16 / 9));
            height: min(100vh, calc(100vw * 9 / 16));
            max-width: 1600px;
            max-height: 900px;
            display: grid;
            grid-template-columns: 52% 48%;
          }

          .qc-video-slot {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            pointer-events: none;
          }

          /* Doctor Stage (Column 1) */
          .qc-doctor-stage {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 26px 36px;
            pointer-events: none;
          }
          .qc-topbar {
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: auto;
          }
          .qc-back-link {
            color: rgba(255, 255, 255, 0.7);
            font-size: 11px;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 500;
            transition: color 0.2s;
          }
          .qc-back-link:hover {
            color: #D4AF37;
          }
          .qc-trust-bar {
            display: flex;
            gap: 12px;
            font-size: 9.5px;
            text-transform: uppercase;
            letter-spacing: 1.1px;
            color: rgba(240, 225, 185, 0.85);
            font-weight: 500;
            pointer-events: auto;
          }

          /* Login Stage (Column 2): Sits strictly inside the right frame */
          .qc-login-stage {
            position: relative;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 6% 24px 8%;
            pointer-events: auto;
          }
          .qc-frame-inner {
            width: min(420px, calc(100% - 24px));
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .qc-auth-card {
            width: 100%;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            border: 1.5px solid rgba(212, 175, 55, 0.45);
            border-radius: 18px;
            padding: 22px 24px 20px;
            box-shadow: 0 20px 50px rgba(10, 2, 18, 0.5), 0 0 20px rgba(212, 175, 55, 0.1);
          }
        }

        /* ══ COMPACT DESKTOP (e.g. 1024x768, 1280x720, or short screens): Keep card strictly inside frame ══ */
        @media (min-width: 1024px) and (max-height: 800px) {
          .qc-auth-card {
            padding: 16px 20px 14px;
            border-radius: 16px;
          }
          .qc-card-header {
            margin-bottom: 8px;
          }
          .qc-greet-h {
            font-size: 20px;
          }
          .qc-greet-s {
            font-size: 11px;
          }
          .qc-google-btn {
            padding: 7px 12px;
            font-size: 11.5px;
          }
          .qc-divider {
            margin: 7px 0;
          }
          .qc-tabs {
            margin-bottom: 8px;
          }
          .qc-tab-btn {
            padding: 5px 12px;
            font-size: 11.5px;
          }
          .qc-input-group {
            gap: 2px;
            margin-bottom: 7px;
          }
          .qc-input-group label {
            font-size: 9.5px;
          }
          .qc-input {
            padding: 7px 10px;
            font-size: 11.5px;
          }
          .qc-submit-btn {
            padding: 9px;
            font-size: 10px;
            margin-top: 2px;
          }
          .qc-switch-text {
            font-size: 10.5px;
            margin-top: 7px;
          }
          .qc-legal {
            font-size: 9px;
            margin-top: 7px;
            padding-top: 6px;
          }
        }

        /* ══ TABLET & MOBILE (< 1024px): Stacked vertical layout ══ */
        @media (max-width: 1023px) {
          .qc-stage-canvas {
            width: 100%;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            background: #150625;
          }
          .qc-video-slot {
            position: relative;
            width: 100%;
            height: min(42vh, 340px);
            min-height: 200px;
            background: #150625;
            overflow: hidden;
          }
          .qc-doctor-stage {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: min(42vh, 340px);
            min-height: 200px;
            z-index: 15;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 16px 20px;
            pointer-events: none;
          }
          .qc-topbar {
            display: flex;
            flex-direction: column;
            gap: 6px;
            pointer-events: auto;
          }
          .qc-back-link {
            color: rgba(255, 255, 255, 0.75);
            font-size: 11px;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }
          .qc-trust-bar {
            display: none;
          }
          .qc-login-stage {
            position: relative;
            flex: 1;
            padding: 20px 16px 40px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            background: #150625;
            z-index: 20;
          }
          .qc-frame-inner {
            width: min(420px, 100%);
          }
          .qc-auth-card {
            width: 100%;
            background: #ffffff;
            border: 1.5px solid rgba(212, 175, 55, 0.45);
            border-radius: 18px;
            padding: 22px 20px;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
          }
        }

        /* ══ CARD CHOREOGRAPHY & REVEAL ══ */
        .qc-auth-card {
          opacity: 0;
          transform: translateY(14px) scale(0.98);
          transition: opacity 0.45s ease-out, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
          will-change: opacity, transform;
        }
        .qc-auth-card.qc-revealed {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        @media (prefers-reduced-motion: reduce) {
          .qc-auth-card {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
            pointer-events: auto !important;
          }
        }

        /* ══ CARD INTERNAL TYPOGRAPHY & ELEMENTS ══ */
        .qc-card-header {
          margin-bottom: 12px;
        }
        .qc-greet-h {
          font-family: Georgia, serif;
          font-size: 22px;
          color: #2A0F3A;
          margin: 0 0 2px;
          font-weight: 400;
          letter-spacing: -0.02em;
        }
        .qc-greet-s {
          font-size: 12px;
          color: #665570;
          margin: 0;
        }
        .qc-google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 9px 14px;
          border: 1.5px solid var(--line, rgba(42, 15, 58, 0.14));
          border-radius: 6px;
          background: #fff;
          color: #3c4043;
          font-size: 12px;
          font-weight: 600;
          width: 100%;
          cursor: pointer;
          transition: all 0.18s ease;
          text-decoration: none;
          font-family: inherit;
        }
        .qc-google-btn:hover {
          background: #f8f4ff;
          border-color: rgba(42, 15, 58, 0.28);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .qc-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 10px 0;
        }
        .qc-divider-line {
          flex: 1;
          height: 1px;
          background: var(--line, rgba(42, 15, 58, 0.12));
        }
        .qc-divider-text {
          font-size: 10px;
          color: var(--muted, #777);
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .qc-tabs {
          display: flex;
          border-bottom: 1.5px solid var(--line, rgba(42, 15, 58, 0.12));
          margin-bottom: 12px;
        }
        .qc-tab-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          color: var(--muted, #777);
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .qc-tab-btn.active {
          color: var(--purple, #2A0F3A);
          border-bottom-color: var(--gold, #C19A6B);
        }
        .qc-input-group {
          display: grid;
          gap: 3px;
          margin-bottom: 8px;
        }
        .qc-input-group label {
          font-size: 10px;
          font-weight: 600;
          color: #333;
        }
        .qc-input {
          padding: 9px 11px;
          border: 1.5px solid var(--line, rgba(42, 15, 58, 0.14));
          border-radius: 6px;
          background: #fff;
          font-size: 12px;
          width: 100%;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
          color: var(--ink, #333);
        }
        .qc-input:focus {
          border-color: var(--gold, #C19A6B);
          box-shadow: 0 0 0 3px rgba(193, 154, 107, 0.12);
        }
        .qc-input:disabled {
          opacity: 0.6;
          background: #f5f5f5;
          cursor: not-allowed;
        }
        .qc-submit-btn {
          width: 100%;
          background: var(--purple, #2A0F3A);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 11px;
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
        }
        .qc-submit-btn:hover:not(:disabled) {
          background: #4a1a6a;
          transform: translateY(-1px);
        }
        .qc-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .qc-msg {
          padding: 8px 12px;
          font-size: 11.5px;
          margin-bottom: 10px;
          line-height: 1.4;
          border-radius: 4px;
        }
        .qc-msg.error {
          background: #fce4ec;
          color: #b34141;
          border-left: 3px solid #f44336;
        }
        .qc-msg.success {
          background: #e9f7e9;
          color: #2e7d32;
          border-left: 3px solid #4caf50;
        }
        .qc-msg.info {
          background: #fff9e6;
          color: #874d00;
          border-left: 3px solid #ffb300;
        }
        .qc-switch-text {
          font-size: 11.5px;
          margin-top: 10px;
          color: #666;
          text-align: center;
        }
        .qc-switch-btn {
          background: none;
          border: none;
          color: var(--purple, #2A0F3A);
          font-size: 11.5px;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
          font-family: inherit;
          font-weight: 600;
        }
        .qc-legal {
          font-size: 9.5px;
          color: #777;
          margin-top: 10px;
          line-height: 1.4;
          border-top: 1px solid var(--line, rgba(42, 15, 58, 0.1));
          padding-top: 8px;
          text-align: center;
        }
        .qc-legal a {
          color: var(--purple, #2A0F3A);
          text-decoration: underline;
        }
      `}</style>

      <div className="qc-auth-viewport" role="main">
        <div className="qc-stage-canvas">
          {/* Full cinematic backdrop rendering doctor-login-scene.mp4 without cropping */}
          <div className="qc-video-slot">
            <DoctorCinematicScene
              ref={sceneRef}
              config={cfg.scene}
              reducedMotion={reducedMotion}
              celebrate={celebrate}
              onReveal={handleReveal}
              formFocus={formFocus}
              authTab={authTab}
              forgotMode={forgotMode}
              authLoading={authLoading}
              authMessage={authMessage}
            />
          </div>

          {/* ══ DOCTOR STAGE (LEFT) ══ */}
          <div className="qc-doctor-stage">
            <div className="qc-topbar">
              <Link href="/" className="qc-back-link" aria-label="Back to Queens Care home">
                ← Queens Care
              </Link>
              <BrandLogo inverse showText={false} overrideHeight={30} overrideMaxWidth={140} />
            </div>

            <div className="qc-trust-bar">
              {cfg.trustItems.map((item, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <span aria-hidden="true" style={{ width: 3, height: 3, borderRadius: "50%", background: "#D4AF37", opacity: 0.6 }} />
                  )}
                  <span>{item}</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ══ LOGIN STAGE (RIGHT) ══ */}
          <div className="qc-login-stage">
            <div className="qc-frame-inner">
              <div className={`qc-auth-card${revealed ? " qc-revealed" : ""}${celebrate ? " qc-celebrate" : ""}`}>
                <div className="qc-card-header">
                  <h2 className="qc-greet-h">{greeting.heading}</h2>
                  <p className="qc-greet-s">{greeting.sub}</p>
                </div>

                {queryError === "google_not_configured" && (
                  <div className="qc-msg info">
                    <b style={{ display: "block", marginBottom: 4, fontSize: 12 }}>⚙️ Google OAuth Setup Required</b>
                    <p style={{ margin: "0 0 6px", fontSize: 11 }}>Add these keys to your <code>.env.local</code> file:</p>
                    <pre style={{ background: "#fff", padding: 6, border: "1px solid #ffd591", fontSize: 10, overflowX: "auto", margin: "0 0 6px" }}>
{`GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AUTH_SECRET=your_auth_secret`}
                    </pre>
                  </div>
                )}

                {!forgotMode && (
                  <>
                    <a href="/api/auth/google" className="qc-google-btn" aria-label={authTab === "login" ? "Sign in with Google" : "Sign up with Google"}>
                      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>{authTab === "login" ? "Sign in with Google" : "Sign up with Google"}</span>
                    </a>
                    <div className="qc-divider">
                      <div className="qc-divider-line" />
                      <span className="qc-divider-text">or with email</span>
                      <div className="qc-divider-line" />
                    </div>
                  </>
                )}

                {!forgotMode && (
                  <div className="qc-tabs">
                    <button
                      type="button"
                      className={`qc-tab-btn${authTab === "login" ? " active" : ""}`}
                      onClick={() => { setAuthTab("login"); }}
                      aria-selected={authTab === "login"}
                      role="tab"
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      className={`qc-tab-btn${authTab === "register" ? " active" : ""}`}
                      onClick={() => { setAuthTab("register"); }}
                      aria-selected={authTab === "register"}
                      role="tab"
                    >
                      Create account
                    </button>
                  </div>
                )}

                {authMessage && (
                  <div className={`qc-msg ${isErrorMsg(authMessage) ? "error" : "success"}`} role="alert">
                    {authMessage}
                  </div>
                )}

                {forgotMode ? (
                  <form onSubmit={handleForgot} style={{ display: "grid", gap: 10 }} noValidate>
                    <div className="qc-input-group">
                      <label htmlFor="qc-forgot-email">Email address</label>
                      <input
                        id="qc-forgot-email"
                        type="email"
                        required
                        placeholder="Your email address"
                        value={authForm.email}
                        onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                        onFocus={() => setFormFocus("email")}
                        onBlur={() => setFormFocus(null)}
                        className="qc-input"
                        disabled={authLoading}
                        autoComplete="email"
                      />
                    </div>
                    <button type="submit" disabled={authLoading} className="qc-submit-btn">
                      {authLoading ? (
                        <span style={{ opacity: 0.7 }}>Sending…</span>
                      ) : (
                        <>Send reset link <span aria-hidden="true">→</span></>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotMode(false)}
                      style={{ background: "none", border: "none", color: "var(--purple, #2A0F3A)", fontSize: 11.5, cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                    >
                      ← Back to sign in
                    </button>
                  </form>
                ) : (
                  <form onSubmit={authTab === "login" ? handleLogin : handleRegister} style={{ display: "grid", gap: 8 }} noValidate>
                    {authTab === "register" && (
                      <div className="qc-input-group">
                        <label htmlFor="qc-name">Full name</label>
                        <input
                          id="qc-name"
                          type="text"
                          required
                          placeholder="Your full name"
                          value={authForm.name}
                          onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                          onFocus={() => setFormFocus("name")}
                          onBlur={() => setFormFocus(null)}
                          className="qc-input"
                          disabled={authLoading}
                          autoComplete="name"
                        />
                      </div>
                    )}
                    {authTab === "register" && (
                      <div className="qc-input-group">
                        <label htmlFor="qc-phone">Phone number</label>
                        <input
                          id="qc-phone"
                          type="tel"
                          placeholder="Phone number"
                          value={authForm.phone || ""}
                          onChange={e => setAuthForm({ ...authForm, phone: e.target.value })}
                          onFocus={() => setFormFocus("name")}
                          onBlur={() => setFormFocus(null)}
                          className="qc-input"
                          disabled={authLoading}
                          autoComplete="tel"
                        />
                      </div>
                    )}
                    <div className="qc-input-group">
                      <label htmlFor="qc-email">Email address</label>
                      <input
                        id="qc-email"
                        type="email"
                        required
                        placeholder="Email address"
                        value={authForm.email}
                        onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                        onFocus={() => setFormFocus("email")}
                        onBlur={() => setFormFocus(null)}
                        className="qc-input"
                        disabled={authLoading}
                        autoComplete="email"
                      />
                    </div>
                    <div className="qc-input-group">
                      <label htmlFor="qc-password">Password</label>
                      <input
                        id="qc-password"
                        type="password"
                        required
                        minLength={10}
                        placeholder="Password (10+ characters)"
                        value={authForm.password}
                        onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                        onFocus={() => setFormFocus("password")}
                        onBlur={() => setFormFocus(null)}
                        className="qc-input"
                        disabled={authLoading}
                        autoComplete={authTab === "login" ? "current-password" : "new-password"}
                      />
                    </div>
                    {authTab === "register" && (
                      <div className="qc-input-group">
                        <label htmlFor="qc-confirm">Confirm password</label>
                        <input
                          id="qc-confirm"
                          type="password"
                          required
                          minLength={10}
                          placeholder="Confirm password"
                          value={authForm.confirmPassword || ""}
                          onChange={e => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                          onFocus={() => setFormFocus("password")}
                          onBlur={() => setFormFocus(null)}
                          className="qc-input"
                          disabled={authLoading}
                          autoComplete="new-password"
                        />
                      </div>
                    )}
                    {authTab === "login" && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted, #555)", userSelect: "none", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={authForm.rememberMe !== false}
                            onChange={e => setAuthForm({ ...authForm, rememberMe: e.target.checked })}
                            style={{ width: 14, height: 14, accentColor: "#2A0F3A", cursor: "pointer" }}
                          />
                          Keep me signed in
                        </label>
                        <button
                          type="button"
                          onClick={() => setForgotMode(true)}
                          style={{ background: "none", border: "none", color: "var(--muted, #777)", fontSize: 11, cursor: "pointer", padding: "4px 0", fontFamily: "inherit" }}
                          aria-label="Forgot your password?"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                    <button type="submit" disabled={authLoading} className="qc-submit-btn">
                      {authLoading ? (
                        <span style={{ opacity: 0.7 }}>Please wait…</span>
                      ) : authTab === "login" ? (
                        <>{ctaLabel} <span aria-hidden="true">→</span></>
                      ) : (
                        <>Create account <span aria-hidden="true">→</span></>
                      )}
                    </button>
                  </form>
                )}

                {!forgotMode && (
                  <p className="qc-switch-text">
                    {authTab === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button
                      type="button"
                      className="qc-switch-btn"
                      onClick={() => { setAuthTab(authTab === "login" ? "register" : "login"); }}
                    >
                      {authTab === "login" ? "Create one" : "Sign in"}
                    </button>
                  </p>
                )}

                <p className="qc-legal">
                  By signing in, you agree to our{" "}
                  <Link href="/terms" style={{ color: "var(--purple, #2A0F3A)", textDecoration: "underline" }}>Terms of Service</Link>{" "}
                  and{" "}
                  <Link href="/privacy" style={{ color: "var(--purple, #2A0F3A)", textDecoration: "underline" }}>Privacy Policy</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
