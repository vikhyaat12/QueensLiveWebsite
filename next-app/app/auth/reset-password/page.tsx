"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("Reset token is missing from the link. Please request a new link.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setIsSuccess(true);
        setMessage("Your password has been reset successfully! Redirecting to sign in…");
        setTimeout(() => {
          router.push("/account");
        }, 2000);
      } else {
        setMessage(data.error || "Failed to reset password. The link may have expired.");
      }
    } catch {
      setMessage("A network error occurred. Please try again.");
    }
    setLoading(false);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 45%, #2B0E44 0%, #1E0830 55%, #12041D 100%)",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          borderRadius: 8,
          padding: "36px 32px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-block", marginBottom: 12 }}>
            <BrandLogo overrideHeight={34} overrideMaxWidth={150} />
          </div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "#b8860b", fontWeight: 700, margin: "0 0 4px" }}>
            Secure Care Account
          </p>
          <h1 style={{ font: "26px var(--font-display, Georgia, serif)", margin: 0, color: "var(--purple, #240e35)", fontWeight: 400 }}>
            Set New Password
          </h1>
        </div>

        {message && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 6,
              fontSize: 13,
              marginBottom: 20,
              background: isSuccess ? "#e8f5e9" : "#ffebee",
              color: isSuccess ? "#2e7d32" : "#c62828",
              border: `1px solid ${isSuccess ? "#c8e6c9" : "#ffcdd2"}`,
            }}
          >
            {message}
          </div>
        )}

        {!isSuccess ? (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#333" }}>
                New Password (8+ characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1.5px solid #ddd",
                  borderRadius: 4,
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "#333" }}>
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1.5px solid #ddd",
                  borderRadius: 4,
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 20px",
                background: "var(--purple, #240e35)",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                cursor: loading ? "wait" : "pointer",
                marginTop: 6,
              }}
            >
              {loading ? "Updating Password…" : "Update Password →"}
            </button>

            <div style={{ textAlign: "center", marginTop: 12 }}>
              <Link href="/account" style={{ fontSize: 12, color: "var(--purple, #240e35)", textDecoration: "underline" }}>
                ← Return to sign in
              </Link>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link
              href="/account"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "var(--purple, #240e35)",
                color: "#fff",
                textDecoration: "none",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Go to Sign In →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#12041D" }} />}>
      <ResetPasswordInner />
    </Suspense>
  );
}
