"use client";

/**
 * Queens Care — Login Page (branch only, new file)
 *
 * FIXES AUDIT ISSUE: the main-branch Login page imported neither
 * header nor footer. This version renders QueensSiteHeader, so a
 * visitor can always reach Home/Shop/FAQ from Login.
 *
 * Auth logic is NOT in this file. Login, register and forgot-password
 * are delegated to the caller's existing /api/auth/* handlers via
 * props. No credential is stored, logged or invented here.
 */

import { useState, type FormEvent } from "react";
import QueensSectionShell from "./QueensSectionShell";
import QueensSiteHeader from "./QueensSiteHeader";

type Props = {
  onLogin?: (data: { email: string; password: string }) => Promise<void> | void;
  onRegister?: () => void;
  onForgotPassword?: () => void;
  error?: string;
};

export default function QueensLoginPage({ onLogin, onRegister, onForgotPassword, error }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try { await onLogin?.({ email, password }); } finally { setLoading(false); }
  }
  return (
    <main>
      <QueensSiteHeader />
      <QueensSectionShell eyebrow="Welcome back" title="Login to Queens Care" subtitle="Use your existing account. Admin access remains gated by the existing requireUser check — this page does not bypass it.">
        <form onSubmit={submit} className="queens-auth-form">
          {error ? <p role="alert" className="queens-auth-error">{error}</p> : null}
          <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
          <label>Password<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
          <button type="submit" className="queens-btn queens-btn-gold" disabled={loading}>{loading ? "Logging in…" : "Login"}</button>
          <div className="queens-auth-links">
            <button type="button" onClick={onForgotPassword}>Forgot password?</button>
            <button type="button" onClick={onRegister}>Create an account</button>
            <a href="/shop">Continue as guest → Shop</a>
          </div>
        </form>
      </QueensSectionShell>
      <style>{`
        .queens-auth-form { max-width: 480px; margin: 0 auto; display: grid; gap: 14px; background: #faf7f1; padding: 28px; border-radius: 22px; }
        .queens-auth-form label { font-weight: 700; color: #2a0f3a; display: grid; gap: 6px; }
        .queens-auth-form input { padding: 13px 15px; border-radius: 12px; border: 1px solid rgba(42,15,58,.2); font: inherit; }
        .queens-auth-error { background: #fdf0f0; color: #9b2c2c; padding: 12px 14px; border-radius: 12px; font-weight: 700; }
        .queens-auth-links { display: flex; gap: 14px; flex-wrap: wrap; }
        .queens-auth-links button { background: none; border: 0; color: #2a0f3a; font-weight: 700; cursor: pointer; text-decoration: underline; }
        .queens-auth-links a { color: #2a0f3a; font-weight: 700; }
      `}</style>
    </main>
  );
}
