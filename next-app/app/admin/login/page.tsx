"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "../../components/BrandLogo";

/* ═══════════════════════════════════════════════════════════════
   Admin Login — Queens Care Laboratories
   Premium two-column layout with animated doctor panel.
   Auth logic preserved exactly. UI only upgraded.
   ═══════════════════════════════════════════════════════════════ */

function AdminDoctorSVG() {
  return (
    <svg
      viewBox="0 0 300 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxWidth: 220, height: "auto" }}
      aria-hidden="true"
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .adm-float { animation: admFloat 6s ease-in-out infinite; }
          .adm-head { animation: admHeadSway 5s ease-in-out infinite; transform-origin: 150px 120px; }
          .adm-blink-l ellipse, .adm-blink-r ellipse {
            animation: admBlink 4s ease-in-out infinite;
          }
          .adm-blink-r ellipse { animation-delay: 0.12s; }
          .adm-breathe { animation: admBreathe 3.5s ease-in-out infinite; transform-origin: 150px 240px; }
          @keyframes admFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          @keyframes admHeadSway { 0%,100%{transform:rotate(-1.5deg)} 50%{transform:rotate(1.5deg)} }
          @keyframes admBlink { 0%,92%,100%{ry:3.5} 95%,97%{ry:0.2} }
          @keyframes admBreathe { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.016)} }
        }
      `}</style>

      <g className="adm-float">
        {/* Shadow */}
        <ellipse cx="150" cy="376" rx="62" ry="7" fill="rgba(40,13,56,0.2)" />

        {/* Lab coat */}
        <g className="adm-breathe">
          <path d="M88 196 C86 165 104 150 150 146 C196 150 214 165 212 196 L218 358 C218 372 202 378 150 378 C98 378 82 372 88 358 Z" fill="#F0EEF5" stroke="#DDD8EC" strokeWidth="1.5" />
          <path d="M128 158 L150 180 L172 158" fill="none" stroke="#E0DCEC" strokeWidth="1.5" />
          <line x1="150" y1="174" x2="150" y2="352" stroke="#E8E4F0" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="150" cy="210" r="2.5" fill="#D4AF37" />
          <circle cx="150" cy="246" r="2.5" fill="#D4AF37" />
          <circle cx="150" cy="282" r="2.5" fill="#D4AF37" />

          {/* QC badge on chest */}
          <circle cx="184" cy="188" r="12" fill="#2A0F3A" stroke="#D4AF37" strokeWidth="1.5" />
          <text x="184" y="192" textAnchor="middle" fill="#D4AF37" fontSize="9" fontFamily="Georgia,serif" fontStyle="italic" fontWeight="bold">Q</text>

          {/* Name badge */}
          <rect x="96" y="264" width="42" height="22" rx="2" fill="white" stroke="#D4AF37" strokeWidth="0.8" />
          <text x="117" y="273" textAnchor="middle" fill="#2A0F3A" fontSize="5" fontFamily="sans-serif" fontWeight="700" letterSpacing="0.5">DR. QUEENS</text>
          <text x="117" y="281" textAnchor="middle" fill="#888" fontSize="3.8" fontFamily="sans-serif">ADMIN ACCESS</text>

          {/* Stethoscope */}
          <path d="M126 168 Q116 195 120 220 Q124 245 136 248" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
          <circle cx="136" cy="250" r="5" fill="#D4AF37" />
          <path d="M126 168 Q122 162 118 158" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M134 168 Q138 162 142 158" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="118" cy="157" r="2" fill="#D4AF37" />
          <circle cx="142" cy="157" r="2" fill="#D4AF37" />
        </g>

        {/* Arms */}
        <path d="M88 205 Q74 230 72 278" fill="none" stroke="#F0EEF5" strokeWidth="18" strokeLinecap="round" />
        <path d="M88 205 Q74 230 72 278" fill="none" stroke="#DDD8EC" strokeWidth="1" />
        <ellipse cx="72" cy="281" rx="9" ry="7" fill="#C8956C" />

        <path d="M212 205 Q226 228 228 268" fill="none" stroke="#F0EEF5" strokeWidth="18" strokeLinecap="round" />
        <path d="M212 205 Q226 228 228 268" fill="none" stroke="#DDD8EC" strokeWidth="1" />
        {/* Right hand holding clipboard */}
        <ellipse cx="228" cy="271" rx="9" ry="7" fill="#C8956C" />
        {/* Clipboard */}
        <rect x="222" y="268" width="34" height="46" rx="3" fill="#EDE8F0" stroke="#D4AF37" strokeWidth="1" />
        <rect x="234" y="264" width="10" height="8" rx="2" fill="#D4AF37" />
        <line x1="227" y1="278" x2="251" y2="278" stroke="#CCC" strokeWidth="1" />
        <line x1="227" y1="285" x2="251" y2="285" stroke="#CCC" strokeWidth="1" />
        <line x1="227" y1="292" x2="244" y2="292" stroke="#CCC" strokeWidth="1" />
        <line x1="227" y1="299" x2="248" y2="299" stroke="#CCC" strokeWidth="1" />
        <line x1="227" y1="306" x2="240" y2="306" stroke="#CCC" strokeWidth="1" />

        {/* Neck */}
        <rect x="138" y="126" width="24" height="24" rx="9" fill="#C8956C" />

        {/* Head group */}
        <g className="adm-head">
          <ellipse cx="150" cy="100" rx="44" ry="48" fill="#C8956C" />
          {/* Hair */}
          <path d="M106 88 C106 50 126 26 150 24 C174 26 194 50 194 88 C192 66 180 42 150 40 C120 42 108 66 106 88 Z" fill="#2D1505" />
          <ellipse cx="150" cy="30" rx="22" ry="13" fill="#2D1505" />
          <ellipse cx="150" cy="26" rx="14" ry="9" fill="#3D2010" />
          <path d="M140 30 L160 30" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
          {/* Eyebrows */}
          <path d="M122 85 Q132 81 142 85" fill="none" stroke="#2D1505" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M158 85 Q168 81 178 85" fill="none" stroke="#2D1505" strokeWidth="1.8" strokeLinecap="round" />
          {/* Eyes */}
          <g className="adm-blink-l">
            <ellipse cx="133" cy="97" rx="4.5" ry="3.5" fill="#2D1505" />
            <circle cx="134" cy="96" r="1" fill="white" opacity="0.9" />
          </g>
          <g className="adm-blink-r">
            <ellipse cx="167" cy="97" rx="4.5" ry="3.5" fill="#2D1505" />
            <circle cx="168" cy="96" r="1" fill="white" opacity="0.9" />
          </g>
          {/* Nose */}
          <path d="M147 105 Q150 113 153 105" fill="none" stroke="#B8845C" strokeWidth="1" strokeLinecap="round" />
          {/* Smile */}
          <path d="M136 116 Q150 126 164 116" fill="none" stroke="#A0544A" strokeWidth="2" strokeLinecap="round" />
          {/* Blush */}
          <ellipse cx="120" cy="108" rx="10" ry="5" fill="rgba(210,120,100,0.18)" />
          <ellipse cx="180" cy="108" rx="10" ry="5" fill="rgba(210,120,100,0.18)" />
          {/* Earrings */}
          <circle cx="106" cy="108" r="3.5" fill="#C8956C" />
          <circle cx="106" cy="108" r="1.8" fill="#D4AF37" />
          <circle cx="194" cy="108" r="3.5" fill="#C8956C" />
          <circle cx="194" cy="108" r="1.8" fill="#D4AF37" />
        </g>
      </g>
    </svg>
  );
}

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      const me = await fetch("/api/auth/me");
      const meData = await me.json();
      if (meData.user?.role === "admin" || meData.user?.role === "employee") {
        router.push("/admin");
      } else {
        setError("Access denied. Admin or authorized employee credentials required.");
        setLoading(false);
        await fetch("/api/auth/logout", { method: "POST" });
      }
    } catch {
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .qc-adm-root {
          min-height: 100vh;
          display: flex;
          align-items: stretch;
          background: #0e0618;
          overflow: hidden;
        }
        .qc-adm-left {
          width: 44%;
          min-height: 100vh;
          background: linear-gradient(160deg, #1E0830 0%, #2A0F3A 55%, #180626 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 36px;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .qc-adm-right {
          flex: 1;
          background: #FAFAF8;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 48px;
          overflow-y: auto;
        }
        .qc-adm-card { width: 100%; max-width: 400px; }
        .qc-adm-input {
          padding: 13px 14px;
          border: 1.5px solid rgba(42,15,58,.14);
          background: #fff;
          font-size: 14px;
          width: 100%;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .qc-adm-input:focus {
          border-color: #C19A6B;
          box-shadow: 0 0 0 3px rgba(193,154,107,0.12);
        }
        .qc-adm-input:disabled { opacity: 0.6; background: #f5f5f5; }
        .qc-adm-submit {
          width: 100%;
          background: #2A0F3A;
          color: white;
          border: none;
          padding: 15px 20px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
          font-family: inherit;
        }
        .qc-adm-submit:hover:not(:disabled) { background: #4a1a6a; transform: translateY(-2px); }
        .qc-adm-submit:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
        .qc-adm-orb-1 {
          position: absolute; width: 200px; height: 200px; border-radius: 50%;
          background: radial-gradient(circle, rgba(212,175,55,0.14) 0%, transparent 70%);
          top: 5%; right: 10%; pointer-events: none;
        }
        .qc-adm-orb-2 {
          position: absolute; width: 130px; height: 130px; border-radius: 50%;
          background: radial-gradient(circle, rgba(93,53,149,0.3) 0%, transparent 70%);
          bottom: 15%; left: 8%; pointer-events: none;
        }
        @media (prefers-reduced-motion: no-preference) {
          .qc-adm-orb-1 { animation: admOrb1 10s ease-in-out infinite; }
          .qc-adm-orb-2 { animation: admOrb2 13s ease-in-out infinite; }
          @keyframes admOrb1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(8px,-14px)} }
          @keyframes admOrb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-7px,10px)} }
        }
        @media (max-width: 480px) {
          .qc-adm-left { display: none !important; }
          .qc-adm-right { padding: 32px 20px; }
        }
        @media (min-width: 481px) and (max-width: 768px) {
          .qc-adm-root { flex-direction: column; }
          .qc-adm-left { width: 100%; min-height: 200px; padding: 24px 20px; }
          .qc-adm-right { padding: 32px 24px; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .qc-adm-left { width: 40%; }
        }
      `}</style>

      <main className="qc-adm-root" role="main">
        {/* LEFT: Doctor Panel */}
        <div className="qc-adm-left">
          <div className="qc-adm-orb-1" aria-hidden="true" />
          <div className="qc-adm-orb-2" aria-hidden="true" />

          <div style={{ marginBottom: 32, alignSelf: "flex-start", position: "relative", zIndex: 2 }}>
            <BrandLogo inverse showText={false} overrideHeight={34} overrideMaxWidth={150} />
          </div>

          <div style={{ position: "relative", zIndex: 2, width: "100%", display: "flex", justifyContent: "center" }}>
            <AdminDoctorSVG />
          </div>

          <div style={{ position: "relative", zIndex: 2, textAlign: "center", marginTop: 20 }}>
            <div style={{ width: 40, height: 2, background: "linear-gradient(90deg, transparent, #D4AF37, transparent)", margin: "0 auto 14px" }} />
            <p style={{ font: "clamp(18px,2.5vw,22px) var(--font-display, Georgia, serif)", color: "#F5F0FF", margin: "0 0 8px", fontWeight: 400 }}>
              Secure Admin Portal
            </p>
            <p style={{ fontSize: 12, color: "rgba(212,175,55,0.72)", margin: 0, lineHeight: 1.6 }}>
              Queens Care Laboratories
            </p>
          </div>

          <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 14, alignItems: "center", marginTop: "auto", paddingTop: 20, opacity: 0.45 }}>
            <span style={{ fontSize: 9, color: "rgba(212,175,55,0.8)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Authorized Access Only</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#D4AF37" }} />
            <span style={{ fontSize: 9, color: "rgba(212,175,55,0.8)", letterSpacing: "0.12em", textTransform: "uppercase" }}>256-bit Secure</span>
          </div>
        </div>

        {/* RIGHT: Admin Form */}
        <div className="qc-adm-right">
          <div className="qc-adm-card">
            <a
              href="/"
              style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted, #666)", display: "block", marginBottom: 32, textDecoration: "none" }}
            >
              ← Queens Care
            </a>

            <p style={{ margin: "0 0 8px", color: "#8a6a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.17em", textTransform: "uppercase" }}>
              Administration
            </p>
            <h1 style={{ font: "clamp(28px,4vw,38px) var(--font-display, Georgia, serif)", margin: "0 0 8px", letterSpacing: "-0.03em", color: "#2A0F3A", fontWeight: 400 }}>
              Admin Access
            </h1>
            <p style={{ fontSize: 13, color: "var(--muted, #666)", marginBottom: 32, lineHeight: 1.6 }}>
              Sign in with administrator credentials to access the management dashboard.
            </p>

            {error && (
              <div style={{ padding: "11px 14px", background: "#fce4ec", fontSize: 12.5, marginBottom: 20, color: "#b34141", borderLeft: "3px solid #f44336", lineHeight: 1.5 }} role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label htmlFor="adm-email" style={{ fontSize: 11, fontWeight: 600, color: "#333" }}>Admin email</label>
                <input
                  id="adm-email"
                  type="email"
                  required
                  placeholder="Admin email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="qc-adm-input"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <label htmlFor="adm-password" style={{ fontSize: 11, fontWeight: 600, color: "#333" }}>Password</label>
                <input
                  id="adm-password"
                  type="password"
                  required
                  minLength={10}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="qc-adm-input"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" disabled={loading} className="qc-adm-submit" style={{ marginTop: 4 }}>
                {loading ? "Signing in…" : "Sign in to Dashboard →"}
              </button>
            </form>

            <p style={{ fontSize: 11, color: "var(--muted, #666)", marginTop: 28, lineHeight: 1.7, borderTop: "1px solid rgba(42,15,58,.1)", paddingTop: 16 }}>
              First registered user in development mode automatically receives admin access.
              In production, configure admin users through the database.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
