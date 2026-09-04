import Link from "next/link";

export const metadata = {
  title: "Quality Assurance & Analytical Testing | Queens Care Laboratories",
  description: "Analytical quality assurance protocols, HPLC bioactive potency assays, microbial safety limits, and stability testing.",
};

export default function QualityAssurancePage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 20px 80px" }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, textDecoration: "none", color: "var(--purple)", fontWeight: 500 }}>
          ← Back to Queens Care
        </Link>
      </div>

      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--gold)", margin: "0 0 6px" }}>
          Analytical Quality Assurance
        </p>
        <h1 style={{ font: "36px var(--font-display)", color: "#2A0F3A", margin: "0 0 16px" }}>
          Quality Assurance &amp; Analytical Testing
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--muted)", maxWidth: 780, margin: 0 }}>
          Quality assurance at Queens Care Laboratories is an objective, measurable discipline. Every active compound, carrier base, and finished container is evaluated against predetermined specifications before market release.
        </p>
      </div>

      <div style={{ display: "grid", gap: 32 }}>
        {/* Step 1 */}
        <div style={{ padding: 28, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--purple)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>1</span>
            <h2 style={{ fontSize: 18, color: "var(--purple)", margin: 0 }}>Raw Material Fingerprinting &amp; Purity Verification</h2>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#444", margin: "0 0 12px" }}>
            Before entering the formulation cycle, every incoming botanical extract, antioxidant isolate, and carrier oil undergoes analytical verification. We confirm compound identity and purity through High-Performance Liquid Chromatography (HPLC) and spectroscopic assays to verify zero adulteration.
          </p>
          <div style={{ fontSize: 12, color: "var(--muted)", background: "#fff", padding: "10px 14px", borderRadius: 4, border: "1px solid var(--line)" }}>
            <b>Specification:</b> Active raw constituents must meet a minimum purity specification of 98.0% or certificate of analysis standard before batch compounding.
          </div>
        </div>

        {/* Step 2 */}
        <div style={{ padding: 28, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--purple)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>2</span>
            <h2 style={{ fontSize: 18, color: "var(--purple)", margin: 0 }}>Stability &amp; Accelerated Degradation Testing</h2>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#444", margin: "0 0 12px" }}>
            Formulations undergo controlled environmental chamber stress tests according to ICH guidelines: long-term testing at 25°C / 60% relative humidity, and accelerated stress testing at 40°C / 75% relative humidity over 6-month cycles to monitor active stability, pH drift, viscosity changes, and phase separation.
          </p>
          <div style={{ fontSize: 12, color: "var(--muted)", background: "#fff", padding: "10px 14px", borderRadius: 4, border: "1px solid var(--line)" }}>
            <b>Specification:</b> Bioactive potency must not deviate by more than ±5% from nominal claim across simulated product shelf life.
          </div>
        </div>

        {/* Step 3 */}
        <div style={{ padding: 28, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--purple)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>3</span>
            <h2 style={{ fontSize: 18, color: "var(--purple)", margin: 0 }}>Microbiological Limit Testing &amp; Heavy Metals</h2>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#444", margin: "0 0 12px" }}>
            Every batch is incubated for Total Aerobic Microbial Count (TAMC) and Total Combined Yeast/Mould Count (TYMC). In parallel, Inductively Coupled Plasma Mass Spectrometry (ICP-MS) tests screen for traces of Lead, Arsenic, Mercury, and Cadmium.
          </p>
          <div style={{ fontSize: 12, color: "var(--muted)", background: "#fff", padding: "10px 14px", borderRadius: 4, border: "1px solid var(--line)" }}>
            <b>Specification:</b> Total aerobic microbial count &lt; 100 CFU/g. Absence of <i>Pseudomonas aeruginosa</i>, <i>Staphylococcus aureus</i>, and <i>Candida albicans</i>.
          </div>
        </div>

        {/* Step 4 */}
        <div style={{ padding: 28, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--purple)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>4</span>
            <h2 style={{ fontSize: 18, color: "var(--purple)", margin: 0 }}>Batch Retention &amp; Post-Market Surveillance</h2>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#444", margin: "0 0 12px" }}>
            Reserve samples from every serialized batch are archived in climate-controlled retention vaults for the entire shelf-life duration plus 12 months. If any consumer tolerability inquiry arises, our quality control team can retrieve the identical production aliquot for re-testing.
          </p>
          <div style={{ fontSize: 12, color: "var(--muted)", background: "#fff", padding: "10px 14px", borderRadius: 4, border: "1px solid var(--line)" }}>
            <b>Accountability:</b> Batch Certificate of Analysis (CoA) records are maintained digitally and available upon request from certified practitioners.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40, padding: "20px 0", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Link href="/manufacturing" style={{ fontSize: 13, color: "var(--purple)", textDecoration: "none", fontWeight: 600 }}>
          Explore Manufacturing Standards →
        </Link>
        <Link href="/trust" style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>
          Visit Queens Care Trust Center →
        </Link>
      </div>
    </main>
  );
}
