"use client";

import React, { FormEvent, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PremiumAuthPanel, { AuthFormData } from "../account/PremiumAuthPanel";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/account";

  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState<AuthFormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    rememberMe: true,
  });
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if already authenticated
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          router.replace(redirectTarget.startsWith("/") ? redirectTarget : "/account");
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => {
        setCheckingSession(false);
      });
  }, [router, redirectTarget]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password,
          rememberMe: authForm.rememberMe !== false,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAuthMessage(data.error || "Authentication failed.");
        setAuthLoading(false);
      } else {
        setAuthSuccess(true);
        router.refresh();
        setTimeout(() => {
          router.push(redirectTarget.startsWith("/") ? redirectTarget : "/account");
        }, 800);
      }
    } catch {
      setAuthMessage("Network error during sign in. Please try again.");
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: authForm.name,
          email: authForm.email,
          phone: authForm.phone,
          password: authForm.password,
          confirmPassword: authForm.confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAuthMessage(data.error || "Registration failed.");
        setAuthLoading(false);
      } else {
        setAuthSuccess(true);
        router.refresh();
        setTimeout(() => {
          router.push(redirectTarget.startsWith("/") ? redirectTarget : "/account");
        }, 800);
      }
    } catch {
      setAuthMessage("Network error during registration. Please try again.");
      setAuthLoading(false);
    }
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email }),
      });
      const data = await res.json();
      setAuthMessage(data.resetUrl || data.message || "Password recovery instructions sent to your email.");
    } catch {
      setAuthMessage("Network error. Please try again.");
    }
    setAuthLoading(false);
  };

  if (checkingSession) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF9F6" }}>
        <div style={{ textAlign: "center", color: "#2A0F3A" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>👑</div>
          <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.5 }}>Connecting to Queens Care Laboratories…</p>
        </div>
      </div>
    );
  }

  const queryError = searchParams.get("error");

  return (
    <PremiumAuthPanel
      authTab={authTab}
      setAuthTab={setAuthTab}
      authForm={authForm}
      setAuthForm={setAuthForm}
      authMessage={authMessage}
      authLoading={authLoading}
      forgotMode={forgotMode}
      setForgotMode={setForgotMode}
      handleLogin={handleLogin}
      handleRegister={handleRegister}
      handleForgot={handleForgot}
      queryError={queryError}
      authSuccess={authSuccess}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF9F6" }}>
        <p style={{ fontSize: 14, color: "#2A0F3A" }}>Loading authentication portal…</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
