import Link from "next/link";

/* Branded 404 — covers notFound() calls and unmatched routes that bypass the
   soft catch-all (e.g. wrong product URLs). */
export default function NotFound() {
  return (
    <main
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
      <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.17em", textTransform: "uppercase", color: "#8a6a45" }}>
        Page not found
      </p>
      <h1 style={{ font: "clamp(26px, 4vw, 36px) var(--font-display, Georgia, serif)", margin: "0 0 14px", letterSpacing: "-0.03em", color: "#2A0F3A", fontWeight: 400 }}>
        We couldn&apos;t find this page
      </h1>
      <p style={{ margin: "0 0 28px", fontSize: 14, color: "#5c5668", maxWidth: 460, lineHeight: 1.6 }}>
        The address may have changed or the page may have been retired. Explore the collection instead — your care bag is exactly where you left it.
      </p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/shop"
          style={{
            padding: "13px 26px",
            background: "#2A0F3A",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          Shop the collection
        </Link>
        <Link
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
        </Link>
      </div>
    </main>
  );
}
