"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";

interface DoctorRecord {
  id: string;
  name: string;
  photo?: string;
  image?: string;
  qualification?: string;
  regNumber?: string;
  councilRegNo?: string;
  designation?: string;
  specialty?: string;
  clinic?: string;
  experience?: string;
  bio?: string;
  verified?: boolean;
}

export default function DoctorsPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", clinic: "", specialty: "dermatology", qualification: "", regNumber: "", message: "" });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);

  useEffect(() => {
    fetch("/api/doctors")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.doctors)) setDoctors(data.doctors);
      })
      .catch(() => {});
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/doctor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Your application has been submitted. Our medical affairs team will review your registration and contact you shortly.");
        setSubmitted(true);
        setForm({ name: "", email: "", phone: "", clinic: "", specialty: "dermatology", qualification: "", regNumber: "", message: "" });
      } else {
        setMessage(data.error || "Could not submit your application.");
      }
    } catch {
      setMessage("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#fbf9f6" }}>
      <QueensCareHeader />

      {/* ─── LUXURY CLINICAL HERO BANNER ─── */}
      <section style={{ background: "linear-gradient(135deg, #180524 0%, #2A0F3A 100%)", color: "#fff", padding: "48px 20px 52px", borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 20, marginBottom: 14 }}>
            <span style={{ color: "var(--primary-gold, #D4AF37)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              ✦ Clinical &amp; Medical Affairs Division
            </span>
          </div>
          <h1 style={{ font: "38px var(--font-display, serif)", color: "#fff", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            Doctor &amp; Clinical Advisory Network
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, lineHeight: 1.7, maxWidth: 760, margin: 0 }}>
            Queens Care Laboratories collaborates with certified medical practitioners, dermatologists, and clinical pharmacologists to ensure formulations adhere to pharmaceutical rigor, physiological bioavailability, and barrier safety standards.
          </p>
        </div>
      </section>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "36px 20px 60px", width: "100%", boxSizing: "border-box", flex: 1 }}>

      {/* ─── PROFESSIONAL COLLABORATION PILLARS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 48 }}>
        {[
          ["Batch Assay Data", "Direct access to high-performance liquid chromatography (HPLC) active compound assays and stability studies for every batch."],
          ["Clinical Protocol Access", "Comprehensive application guidelines and synergistic routine planning for cosmetic and wellness regimens."],
          ["Ethical Scientific Dialogue", "Direct channels to the Queens Care Formulation Committee for inquiries regarding pharmacological interactions and ingredient tolerability."],
          ["Grievance & Pharmacovigilance", "Priority escalation line to report patient tolerability feedback directly to our quality assurance officers."],
          ["Formulation Transparency", "Complete INCI disclosures without proprietary hidden carrier fluids, masking agents, or artificial fillers."],
          ["Continuing Education", "Specialist symposia, research summaries, and evidence-led updates on bioactive skincare trans-epidermal delivery."],
        ].map(([title, desc]) => (
          <div key={title} style={{ padding: 22, background: "#fff", border: "1px solid var(--line)", borderRadius: 6 }}>
            <b style={{ fontSize: 13, color: "#2A0F3A", display: "block", marginBottom: 8, letterSpacing: ".02em" }}>{title}</b>
            <span style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, display: "block" }}>{desc}</span>
          </div>
        ))}
      </div>

      {/* ─── VERIFIED PARTNER SPECIALISTS & ADVISORY PANEL ─── */}
      {doctors.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--gold)" }}>
              ✦ Clinical Collaboration
            </span>
            <h2 style={{ font: "26px var(--font-display)", color: "#2A0F3A", margin: "6px 0 8px" }}>
              Verified Partner Specialists
            </h2>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
              Independent medical professionals registered with statutory medical councils who advise on formulation tolerability.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {doctors.map(doc => (
              <div key={doc.id} style={{ padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 8, display: "flex", gap: 16, alignItems: "flex-start" }}>
                {(doc.photo || doc.image) ? (
                  <img
                    src={doc.photo || doc.image}
                    alt={doc.name}
                    style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #fff" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--purple)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
                    {doc.name.replace(/^Dr\.\s*/i, "").charAt(0) || "D"}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: 15, margin: 0, color: "var(--purple)" }}>{doc.name}</h3>
                    {doc.verified && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#2e7d32", background: "#e9f7e9", padding: "1px 6px", borderRadius: 4 }}>
                        ✓ Verified Specialist
                      </span>
                    )}
                  </div>
                  {doc.qualification && (
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", margin: "2px 0 0" }}>
                      {doc.qualification}
                    </p>
                  )}
                  {doc.designation && (
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>
                      {doc.designation}
                    </p>
                  )}
                  {doc.clinic && (
                    <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>
                      {doc.clinic}
                    </p>
                  )}
                  {(doc.regNumber || doc.councilRegNo) && (
                    <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0" }}>
                      <b>Council Reg #:</b> {doc.regNumber || doc.councilRegNo}
                    </p>
                  )}
                  {doc.bio && (
                    <p style={{ fontSize: 12, color: "#555", lineHeight: 1.5, margin: "8px 0 0", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 6 }}>
                      {doc.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: "12px 16px", background: "#fff", border: "1px solid var(--line)", borderRadius: 6, fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
            <b>Statutory Collaboration Statement:</b> Partner specialists contribute clinical perspective and feedback on formulation safety. Queens Care does not purchase endorsements or prescribe products. Clinical treatment choices remain at the sole professional discretion of individual licensed healthcare practitioners.
          </div>
        </section>
      )}

      {/* ─── PARTNERSHIP APPLICATION FORM ─── */}
      <section style={{ background: "#fff", padding: 32, border: "1px solid var(--line)", borderRadius: 8 }}>
        {submitted ? (
          <div style={{ padding: 24, background: "#e9f7e9", border: "1px solid #c3e6cb", borderRadius: 6 }}>
            <h2 style={{ font: "20px var(--font-display)", margin: "0 0 8px", color: "#2e7d32" }}>Application Submitted</h2>
            <p style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>{message}</p>
            <button onClick={() => setSubmitted(false)} className="button" style={{ marginTop: 16, border: 0, padding: "8px 16px", background: "var(--purple)", color: "#fff", cursor: "pointer", borderRadius: 4 }}>
              Submit Another Application
            </button>
          </div>
        ) : (
          <div>
            <h2 style={{ font: "22px var(--font-display)", color: "var(--purple)", marginBottom: 8 }}>
              Professional Partnership Application
            </h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
              Licensed medical practitioners and clinic directors are invited to join our scientific network. All applicants are verified against statutory state medical registers.
            </p>
            <form onSubmit={submit} style={{ display: "grid", gap: 14, maxWidth: 640 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Full Name *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Dr. Full Name" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13, borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Official Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="dr.name@clinic.in" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13, borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Contact Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98000 00000" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13, borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Clinic / Hospital Affiliation</label>
                  <input value={form.clinic} onChange={e => setForm({ ...form, clinic: e.target.value })} placeholder="Clinic or Hospital name" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13, borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Medical Specialty</label>
                  <select value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13, borderRadius: 4, background: "#fff" }}>
                    <option value="dermatology">Dermatology</option>
                    <option value="clinical_cosmetology">Clinical Cosmetology</option>
                    <option value="nutrition">Clinical Nutrition</option>
                    <option value="general_practice">General Practice</option>
                    <option value="trichology">Trichology</option>
                    <option value="other">Other Medical Specialization</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Medical Qualification *</label>
                  <input required value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. MBBS, MD (Dermatology)" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13, borderRadius: 4 }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Medical Council Registration Number *</label>
                <input required value={form.regNumber} onChange={e => setForm({ ...form, regNumber: e.target.value })} placeholder="e.g. MCI-489201 / State Medical Council No." style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13, borderRadius: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Clinical Focus &amp; Interest</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Specify clinical inquiries, formulation requests, or research collaboration areas…" style={{ minHeight: 80, padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13, borderRadius: 4 }} />
              </div>
              <button type="submit" disabled={submitting} style={{ padding: "12px 24px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, borderRadius: 4, width: "fit-content" }}>
                {submitting ? "Submitting Application…" : "Submit Practitioner Application →"}
              </button>
            </form>
            {message && !submitted && <p style={{ marginTop: 12, fontSize: 13, color: "#b34141" }}>{message}</p>}
          </div>
        )}
      </section>

      <div style={{ marginTop: 40, padding: "20px 0", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
          For medical affairs inquiries or pharmacovigilance reports: <a href="mailto:care@queenscare.in" style={{ color: "var(--purple)" }}>care@queenscare.in</a>
        </p>
        <Link href="/trust" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>
          Visit Queens Care Trust Center →
        </Link>
      </div>
      </main>
      <QueensCareFooter />
    </div>
  );
}
