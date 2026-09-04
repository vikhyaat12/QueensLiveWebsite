import Link from "next/link";

export const metadata = {
  title: "Manufacturing Standards & Facility Hygiene | Queens Care Laboratories",
  description: "Manufacturing hygiene protocols, cleanroom air handling, precision sterile filling, and direct cold-chain logistics.",
};

export default function ManufacturingPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 20px 80px" }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, textDecoration: "none", color: "var(--purple)", fontWeight: 500 }}>
          ← Back to Queens Care
        </Link>
      </div>

      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--gold)", margin: "0 0 6px" }}>
          Production &amp; Logistics
        </p>
        <h1 style={{ font: "36px var(--font-display)", color: "#2A0F3A", margin: "0 0 16px" }}>
          Manufacturing Standards &amp; Facility Hygiene
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--muted)", maxWidth: 780, margin: 0 }}>
          Precision cosmetic and nutraceutical compounding requires exacting physical environments. Our formulation facilities maintain strict environmental controls, HEPA-filtered air circulation, and nitrogen-flushed filling lines to prevent oxidative breakdown.
        </p>
      </div>

      <div style={{ display: "grid", gap: 32 }}>
        {/* Pillar 1 */}
        <div style={{ padding: 28, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 8 }}>
          <h2 style={{ fontSize: 18, color: "var(--purple)", margin: "0 0 12px" }}>
            Clean Air Handling &amp; Particle Filtration
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#444", margin: "0 0 14px" }}>
            Compounding and primary filling areas operate under positive differential air pressure with multi-stage High-Efficiency Particulate Air (HEPA H14) filtration systems. This continuously evacuates airborne particulates and creates an ultra-hygienic envelope around open formulation tanks and filling nozzles.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12, color: "var(--muted)" }}>
            <div style={{ background: "#fff", padding: "10px 14px", borderRadius: 4, border: "1px solid var(--line)" }}>
              <b style={{ color: "var(--ink)", display: "block" }}>Pressure Differential:</b> +15 Pa positive pressure relative to adjacent preparation corridors.
            </div>
            <div style={{ background: "#fff", padding: "10px 14px", borderRadius: 4, border: "1px solid var(--line)" }}>
              <b style={{ color: "var(--ink)", display: "block" }}>Air Exchange Rate:</b> Continuous 20+ complete room air changes per hour.
            </div>
          </div>
        </div>

        {/* Pillar 2 */}
        <div style={{ padding: 28, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 8 }}>
          <h2 style={{ fontSize: 18, color: "var(--purple)", margin: "0 0 12px" }}>
            Pharmaceutical-Grade Purified Water System
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#444", margin: "0 0 14px" }}>
            Water serves as the primary biological vehicle in aqueous serums. Our facility employs a closed-loop multi-pass Reverse Osmosis (RO) system coupled with Continuous Electro-Deionization (CEDI) and continuous 254nm ultraviolet sanitization loops, producing demineralized water that prevents biofilm formation and heavy metal contamination.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12, color: "var(--muted)" }}>
            <div style={{ background: "#fff", padding: "10px 14px", borderRadius: 4, border: "1px solid var(--line)" }}>
              <b style={{ color: "var(--ink)", display: "block" }}>Conductivity:</b> &lt; 1.1 µS/cm at 20°C conforming to purified water monographs.
            </div>
            <div style={{ background: "#fff", padding: "10px 14px", borderRadius: 4, border: "1px solid var(--line)" }}>
              <b style={{ color: "var(--ink)", display: "block" }}>Total Organic Carbon (TOC):</b> Continuously monitored online below 500 ppb.
            </div>
          </div>
        </div>

        {/* Pillar 3 */}
        <div style={{ padding: 28, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 8 }}>
          <h2 style={{ fontSize: 18, color: "var(--purple)", margin: "0 0 12px" }}>
            Nitrogen Purge &amp; Antioxidant Protection
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#444", margin: "0 0 14px" }}>
            Highly reactive bioactives like L-Ascorbic Acid (Vitamin C), Resveratrol, and Squalane are highly susceptible to atmospheric oxidation. During batch transfer and container dosing, high-purity food-grade nitrogen gas is blanketed over bulk vessels and injected into container headspaces prior to hermetic sealing.
          </p>
          <div style={{ background: "#fff", padding: "10px 14px", borderRadius: 4, border: "1px solid var(--line)", fontSize: 12, color: "var(--muted)" }}>
            <b>Protective Result:</b> Headspace oxygen is reduced below 2%, preventing premature formula browning, discoloration, or loss of antioxidant potency.
          </div>
        </div>

        {/* Pillar 4 */}
        <div style={{ padding: 28, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 8 }}>
          <h2 style={{ fontSize: 18, color: "var(--purple)", margin: "0 0 12px" }}>
            Direct-from-Facility Cold Chain Distribution
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#444", margin: "0 0 14px" }}>
            Unlike third-party mass distributors where inventory languishes in unmonitored non-airconditioned depots, Queens Care operates directly from temperature-controlled logistics centers (18°C – 22°C). Formulations are shipped in thermal-barrier cartons directly to clinics and customer doorsteps.
          </p>
          <div style={{ background: "#fff", padding: "10px 14px", borderRadius: 4, border: "1px solid var(--line)", fontSize: 12, color: "var(--muted)" }}>
            <b>Transit Guarantee:</b> If extreme weather or courier delay compromises temperature integrity, Queens Care provides immediate zero-cost batch replacement under our formulation guarantee.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40, padding: "20px 0", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Link href="/quality-assurance" style={{ fontSize: 13, color: "var(--purple)", textDecoration: "none", fontWeight: 600 }}>
          ← Quality Assurance &amp; Testing
        </Link>
        <Link href="/trust" style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>
          Visit Queens Care Trust Center →
        </Link>
      </div>
    </main>
  );
}
