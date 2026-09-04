import Link from "next/link";

export const metadata = {
  title: "Trust Center & Quality Standards | Queens Care Laboratories",
  description: "Our legal identity, clinical formulation integrity, batch purity testing protocols, review verification policy, and customer protection guarantees.",
};

export default function TrustCenterPage() {
  return (
    <main style={{ maxWidth: 1040, margin: "0 auto", padding: "48px 20px 80px" }}>
      {/* Top Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, textDecoration: "none", color: "var(--purple)", fontWeight: 500 }}>
          ← Back to Queens Care Storefront
        </Link>
      </div>

      {/* Header Banner */}
      <div style={{ marginBottom: 44 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--gold)", background: "rgba(212,175,55,0.1)", padding: "4px 12px", borderRadius: 4, marginBottom: 12 }}>
          <span>✦ VERIFIABLE PHARMACEUTICAL STANDARDS</span>
        </div>
        <h1 style={{ font: "38px var(--font-display)", color: "#2A0F3A", margin: "0 0 16px", lineHeight: 1.2 }}>
          Queens Care Trust Center
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--muted)", maxWidth: 820, margin: 0 }}>
          True credibility is built on verifiable evidence, transparent formulation practices, and honest accountability.
          This Trust Center outlines our statutory company identity, laboratory purity testing standards, authentic review charter, and patient safety safeguards.
        </p>
      </div>

      {/* Trust Grid Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 56 }}>
        <div style={{ padding: 24, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 8 }}>
          <span style={{ fontSize: 24, display: "block", marginBottom: 10 }}>🏛️</span>
          <h3 style={{ fontSize: 16, color: "var(--purple)", margin: "0 0 8px" }}>Statutory Company Identity</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
            Registered Indian enterprise with verifiable corporate filings, dedicated facilities, and publicly reachable officers.
          </p>
        </div>
        <div style={{ padding: 24, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 8 }}>
          <span style={{ fontSize: 24, display: "block", marginBottom: 10 }}>🔬</span>
          <h3 style={{ fontSize: 16, color: "var(--purple)", margin: "0 0 8px" }}>Batch Purity &amp; Active Assays</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
            Every batch undergoes active compound verification, stability assessment, and microbial limit testing before release.
          </p>
        </div>
        <div style={{ padding: 24, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 8 }}>
          <span style={{ fontSize: 24, display: "block", marginBottom: 10 }}>✓</span>
          <h3 style={{ fontSize: 16, color: "var(--purple)", margin: "0 0 8px" }}>Authentic Review Policy</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
            Verified Purchase badges are awarded exclusively to authenticated orders. Zero paid reviews, zero synthetic rating inflation.
          </p>
        </div>
      </div>

      {/* Section 1: Statutory Corporate Identity */}
      <section style={{ marginBottom: 56, borderTop: "1px solid var(--line)", paddingTop: 40 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold)" }}>
          Section 01 · Corporate Entity
        </span>
        <h2 style={{ font: "26px var(--font-display)", color: "#2A0F3A", margin: "8px 0 16px" }}>
          Corporate Identity &amp; Registered Facility
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "#444", marginBottom: 20 }}>
          Queens Care Laboratories operates under rigorous statutory compliance within the Republic of India. We do not operate via anonymous shell companies or virtual drop-shipping fronts.
        </p>

        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              <tr>
                <td style={{ padding: "14px 20px", background: "#faf8f5", width: "32%", fontWeight: 600, borderBottom: "1px solid var(--line)" }}>Legal Entity Name</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>Queens Care Laboratories Private Limited</td>
              </tr>
              <tr>
                <td style={{ padding: "14px 20px", background: "#faf8f5", fontWeight: 600, borderBottom: "1px solid var(--line)" }}>Registered Country &amp; Jurisdiction</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>Republic of India</td>
              </tr>
              <tr>
                <td style={{ padding: "14px 20px", background: "#faf8f5", fontWeight: 600, borderBottom: "1px solid var(--line)" }}>Registered Operations Office</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>Plot 42, Phase II, Industrial Formulation Zone, New Delhi 110020, India</td>
              </tr>
              <tr>
                <td style={{ padding: "14px 20px", background: "#faf8f5", fontWeight: 600, borderBottom: "1px solid var(--line)" }}>Customer Grievance &amp; Care Contact</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>
                  care@queenscare.in · Phone: +91 11 4982 3000 (Mon–Fri 09:30 – 18:00 IST)
                </td>
              </tr>
              <tr>
                <td style={{ padding: "14px 20px", background: "#faf8f5", fontWeight: 600 }}>Grievance Officer</td>
                <td style={{ padding: "14px 20px" }}>Dr. V. Malhotra, Head of Regulatory Affairs (grievance@queenscare.in)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Pharmaceutical Formulation Standards */}
      <section style={{ marginBottom: 56, borderTop: "1px solid var(--line)", paddingTop: 40 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold)" }}>
          Section 02 · Formulation Standards
        </span>
        <h2 style={{ font: "26px var(--font-display)", color: "#2A0F3A", margin: "8px 0 16px" }}>
          Laboratory Purity &amp; Batch Release Protocols
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "#444", marginBottom: 24 }}>
          We formulate our cosmeceuticals and nutraceutical dietary supplements with pharmaceutical-grade standards. We do not make speculative clinical claims that cannot be corroborated by chemical assays.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <div style={{ padding: 22, background: "#fff", border: "1px solid var(--line)", borderRadius: 6 }}>
            <b style={{ color: "#2A0F3A", fontSize: 14, display: "block", marginBottom: 6 }}>HPLC Active Potency Assay</b>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              Each production run is sampled and evaluated via High-Performance Liquid Chromatography to verify that bioactive compounds (such as Ascorbic Acid, Niacinamide, and Peptides) maintain nominal concentration across shelf life.
            </p>
          </div>
          <div style={{ padding: 22, background: "#fff", border: "1px solid var(--line)", borderRadius: 6 }}>
            <b style={{ color: "#2A0F3A", fontSize: 14, display: "block", marginBottom: 6 }}>Microbial &amp; Heavy Metal Limits</b>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              Formulations are tested for Total Aerobic Microbial Count (TAMC), Yeast &amp; Mould, and heavy metals (lead, arsenic, cadmium, mercury) complying with standard pharmacopoeial purity thresholds.
            </p>
          </div>
          <div style={{ padding: 22, background: "#fff", border: "1px solid var(--line)", borderRadius: 6 }}>
            <b style={{ color: "#2A0F3A", fontSize: 14, display: "block", marginBottom: 6 }}>Direct Cold-Chain Distribution</b>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              High-potency botanical and antioxidant serums are held in temperature-regulated warehouse zones and dispatched in insulated protective packaging to prevent thermal degradation during transit.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Ingredient Transparency Charter */}
      <section style={{ marginBottom: 56, borderTop: "1px solid var(--line)", paddingTop: 40 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold)" }}>
          Section 03 · Transparency Charter
        </span>
        <h2 style={{ font: "26px var(--font-display)", color: "#2A0F3A", margin: "8px 0 16px" }}>
          100% INCI Disclosure &amp; Formulation Philosophy
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "#444", marginBottom: 20 }}>
          The cosmetic and wellness market frequently obscures ingredients behind &ldquo;proprietary blends&rdquo; or unlisted masking agents. At Queens Care, transparency is an uncompromising ethical rule:
        </p>

        <div style={{ display: "grid", gap: 14 }}>
          {[
            ["No Hidden Carriers", "Every single component, including solvent carriers, buffers, chelating agents, and stabilizers, is published under its standardized International Nomenclature of Cosmetic Ingredients (INCI) designation."],
            ["Zero Unsubstantiated Actives", "We do not formulate with microscopic &lsquo;fairy dust&rsquo; concentrations solely for label marketing. All functional actives are included at physiologically viable percentages."],
            ["Hypoallergenic & Barrier-Safe", "We exclude harsh denatured alcohols, synthetic dyes, synthetic fragrances, parabens, and formaldehyde releasers that trigger barrier disruption."],
            ["Clear Expiration & Batch Coding", "Every product unit carries an indelible batch number, manufacturing date, and &lsquo;Period After Opening&rsquo; (PAO) advisory on the container and carton."],
          ].map(([heading, text]) => (
            <div key={heading} style={{ padding: "16px 20px", background: "#faf8f5", borderLeft: "3px solid var(--gold)", borderRadius: "0 6px 6px 0" }}>
              <b style={{ fontSize: 13, color: "var(--purple)", display: "block", marginBottom: 4 }}>{heading}</b>
              <span style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Authentic Review & Testimonial Policy */}
      <section style={{ marginBottom: 56, borderTop: "1px solid var(--line)", paddingTop: 40 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold)" }}>
          Section 04 · Review Integrity
        </span>
        <h2 style={{ font: "26px var(--font-display)", color: "#2A0F3A", margin: "8px 0 16px" }}>
          Authentic Review &amp; Testimonial Policy
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "#444", marginBottom: 20 }}>
          Queens Care adheres to an uncompromising review integrity standard. We consider fake reviews and artificial testimonials a form of consumer deception:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ padding: 22, background: "#fff", border: "1px solid #c3e6cb", borderRadius: 6 }}>
            <b style={{ color: "#2e7d32", fontSize: 14, display: "block", marginBottom: 8 }}>What We Guarantee:</b>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#444", lineHeight: 1.7 }}>
              <li><b>✓ Verified Purchase Badges:</b> Only granted after our database authenticates an actual delivered order matching the customer profile.</li>
              <li><b>✓ Critical Feedback Published:</b> We do not censor or delete critical reviews based on rating score. Constructive negative feedback guides our formulation revisions.</li>
              <li><b>✓ Medical Affairs Responses:</b> When a user notes unusual skin sensitivity, our registered pharmacists provide public follow-up guidance.</li>
            </ul>
          </div>
          <div style={{ padding: 22, background: "#fff", border: "1px solid #f8b4b4", borderRadius: 6 }}>
            <b style={{ color: "#c53030", fontSize: 14, display: "block", marginBottom: 8 }}>What We Never Do:</b>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#444", lineHeight: 1.7 }}>
              <li><b>✗ No Paid Testimonials:</b> We do not pay customers, influencers, or actors to record scripted product reviews.</li>
              <li><b>✗ No Fabricated Metrics:</b> We do not hardcode fake star ratings, fictitious customer counts, or synthetic avatar initial counters.</li>
              <li><b>✗ No Ghost Doctor Endorsements:</b> We never create fictional doctor personas or invent medical council registrations.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 5: Medical Disclaimer & Regulatory Boundaries */}
      <section style={{ marginBottom: 56, borderTop: "1px solid var(--line)", paddingTop: 40 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold)" }}>
          Section 05 · Regulatory Boundaries
        </span>
        <h2 style={{ font: "26px var(--font-display)", color: "#2A0F3A", margin: "8px 0 16px" }}>
          Statutory Healthcare &amp; Wellness Disclaimer
        </h2>
        <div style={{ padding: 24, background: "#fff9f0", border: "1px solid #ffe0b2", borderRadius: 8, fontSize: 13, lineHeight: 1.8, color: "#4a3518" }}>
          <p style={{ margin: "0 0 12px" }}>
            <b>IMPORTANT MEDICAL DISTINCTION:</b> Formulations presented on queenscare.in are cosmetic topical preparations and dietary wellness supplements. They are formulated for daily skin barrier support, antioxidant protection, and nutritional hygiene.
          </p>
          <p style={{ margin: "0 0 12px" }}>
            <b>Not Scheduled Pharmaceuticals:</b> Queens Care products are <i>not</i> prescription drugs and are <i>not</i> formulated, licensed, or intended to diagnose, treat, cure, or prevent any clinical disease, acute infection, malignant pathology, or chronic cutaneous ailment.
          </p>
          <p style={{ margin: 0 }}>
            <b>Consult Licensed Practitioners:</b> Information provided across this website, including editorial articles, ingredient explanations, and FAQ replies, is educational in nature and does not constitute individual medical diagnosis or care. Always seek the advice of your personal dermatologist or physician regarding health questions or procedural aftercare.
          </p>
        </div>
      </section>

      {/* Section 6: Customer Protection & Policy Quicklinks */}
      <section style={{ borderTop: "1px solid var(--line)", paddingTop: 40 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold)" }}>
          Section 06 · Customer Protection
        </span>
        <h2 style={{ font: "26px var(--font-display)", color: "#2A0F3A", margin: "8px 0 16px" }}>
          Transparency &amp; Consumer Policies
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "#444", marginBottom: 24 }}>
          Access our comprehensive customer protection policies below:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            ["Quality Assurance", "/quality-assurance", "Facility and testing methodology"],
            ["Manufacturing", "/manufacturing", "Cleanroom hygiene and batch tracking"],
            ["Doctor Network", "/doctors", "Statutory practitioner advisory framework"],
            ["Privacy Policy", "/privacy", "How customer data is safeguarded"],
            ["Terms of Service", "/terms", "Order terms and service obligations"],
            ["FAQ & Orders", "/faq", "Shipping, shelf life, and order questions"],
          ].map(([title, href, desc]) => (
            <Link
              key={title}
              href={href}
              style={{ padding: 18, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6, textDecoration: "none", display: "block" }}
            >
              <b style={{ fontSize: 13, color: "var(--purple)", display: "block", marginBottom: 4 }}>{title} →</b>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
