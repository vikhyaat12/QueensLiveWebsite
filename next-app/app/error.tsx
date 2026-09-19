"use client";

/* Global error boundary — branded, calm, recoverable. Never shows raw
   technical errors to customers. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main
      role="alert"
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        background: "linear-gradient(170deg, #FBFAFE 0%, #F4F0FA 100%)",
        fontFamily: "var(--font-geist, system-ui, sans-serif)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: "1.5px solid rgba(212, 175, 55, 0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#B08F2A",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontSize: 26,
          marginBottom: 22,
        }}
      >
        Q
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.17em", textTransform: "uppercase", color: "#8a6a45" }}>
        Something interrupted us
      </p>
      <h1 style={{ font: "clamp(26px, 4vw, 36px) var(--font-display, Georgia, serif)", margin: "0 0 14px", letterSpacing: "-0.03em", color: "#2A0F3A", fontWeight: 400 }}>
        This page could not be opened
      </h1>
      <p style={{ margin: "0 0 28px", fontSize: 14, color: "#5c5668", maxWidth: 460, lineHeight: 1.6 }}>
        A brief technical pause got in the way. Your bag and account are safe — please try again.
      </p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "13px 26px",
            background: "#2A0F3A",
            color: "#fff",
            border: "none",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Try again
        </button>
        <a
          href="/"
          style={{
            padding: "13px 26px",
            background: "transparent",
            color: "#2A0F3A",
            border: "1px solid rgba(42,15,58,0.25)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          Back to home
        </a>
      </div>
      {error.digest ? (
        <p style={{ margin: "28px 0 0", fontSize: 11, color: "#a49db1" }}>Reference: {error.digest}</p>
      ) : null}
    </main>
  );
}
