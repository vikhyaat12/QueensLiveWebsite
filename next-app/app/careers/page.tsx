"use client";

import React, { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import type { CareerJob, CareerPageConfig } from "@/lib/commerce/store-extensions";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";

export default function CareersPage() {
  const [pageConfig, setPageConfig] = useState<CareerPageConfig | null>(null);
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedMode, setSelectedMode] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Selected role for application
  const [selectedRole, setSelectedRole] = useState<string>("General Application / Talent Pool");
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  // Application form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentDesignation, setCurrentDesignation] = useState("");
  const [highestQualification, setHighestQualification] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(true);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string; id?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCareersData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/careers");
        if (res.ok) {
          const data = await res.json();
          if (data.pageConfig) setPageConfig(data.pageConfig);
          if (Array.isArray(data.jobs)) setJobs(data.jobs);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    loadCareersData();
  }, []);

  const handleApplyClick = (roleTitle: string, jobId?: string) => {
    setSelectedRole(roleTitle);
    setSelectedJobId(jobId || "");
    setFeedback(null);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedDept("all");
    setSelectedMode("all");
    setSelectedType("all");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("whatsapp", whatsapp.trim());
      formData.append("city", city.trim());
      formData.append("position", selectedRole);
      formData.append("jobId", selectedJobId);
      formData.append("experience", experience.trim());
      formData.append("currentCompany", currentCompany.trim());
      formData.append("currentDesignation", currentDesignation.trim());
      formData.append("highestQualification", highestQualification.trim());
      formData.append("linkedinUrl", linkedinUrl.trim());
      formData.append("portfolioUrl", portfolioUrl.trim());
      formData.append("message", message.trim());
      formData.append("consent", consent ? "true" : "false");
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }

      const res = await fetch("/api/careers/apply", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ success: false, msg: data.error || "Failed to submit application." });
      } else {
        setFeedback({
          success: true,
          msg: data.message || "Your application has been received successfully!",
          id: data.application?.id,
        });
        setName("");
        setEmail("");
        setPhone("");
        setWhatsapp("");
        setCity("");
        setExperience("");
        setCurrentCompany("");
        setCurrentDesignation("");
        setHighestQualification("");
        setLinkedinUrl("");
        setPortfolioUrl("");
        setMessage("");
        setResumeFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch {
      setFeedback({ success: false, msg: "Network error occurred. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchTerm ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.skills && job.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesDept = selectedDept === "all" || job.department === selectedDept;
    const matchesMode = selectedMode === "all" || job.workMode === selectedMode;
    const matchesType = selectedType === "all" || job.employmentType === selectedType;

    return matchesSearch && matchesDept && matchesMode && matchesType;
  });

  const availableDepts = Array.from(new Set(jobs.map((j) => j.department).filter(Boolean)));
  const hero = pageConfig?.hero || {
    eyebrow: "Careers at Queens Care Laboratories",
    heading: "Curiosity, Precision, and the Science of Wellbeing.",
    subtitle: "Build the Future of Clinical Wellness with Queens Care Laboratories.",
    description: "We formulate everyday health rituals with uncompromising pharmaceutical rigor. Join our team of biochemists, quality engineers, designers, and operators building India’s standard of clinical wellness.",
  };

  const cultureCards = pageConfig?.cultureCards || [
    {
      id: "cc-1",
      icon: "🔬",
      title: "Evidence-Driven R&D",
      description: "We formulate with active concentrations backed by published randomized control trials, rejecting filler additives and fleeting trends.",
      visible: true,
      sortOrder: 1,
    },
    {
      id: "cc-2",
      icon: "👑",
      title: "High Standards of Care",
      description: "Every batch is manufactured in ISO cleanrooms with multi-stage microbiological and stability testing before reaching customers.",
      visible: true,
      sortOrder: 2,
    },
    {
      id: "cc-3",
      icon: "🌱",
      title: "Continuous Growth",
      description: "We encourage learning, technical publishing, conference participation, and rapid ownership across all business functions.",
      visible: true,
      sortOrder: 3,
    },
  ];

  return (
    <div style={{ background: "#faf8f5", minHeight: "100vh", color: "var(--ink)", paddingBottom: 80 }}>
      {/* Global Header */}
      <QueensCareHeader activePage="careers" />

      {/* Hero Section */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 20px 40px" }}>
        <p className="eyebrow" style={{ color: "#D4AF37", marginBottom: 12, letterSpacing: ".08em", textTransform: "uppercase", fontSize: 12, fontWeight: 700 }}>
          {hero.eyebrow}
        </p>
        <h1 style={{ font: "400 clamp(36px, 5vw, 64px)/1.05 var(--font-display)", color: "var(--purple)", margin: "0 0 20px", maxWidth: 880 }}>
          {hero.heading}
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--muted)", maxWidth: 740, margin: 0 }}>
          {hero.description}
        </p>
      </section>

      {/* Culture Cards */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px 50px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {cultureCards.filter((c) => c.visible !== false).map((card) => (
            <div
              key={card.id}
              style={{
                background: "#fff",
                border: "1px solid var(--line)",
                padding: 28,
                borderRadius: 4,
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              <span style={{ fontSize: 24, display: "block", marginBottom: 12 }}>{card.icon}</span>
              <h3 style={{ font: "20px var(--font-display)", color: "var(--purple)", margin: "0 0 8px" }}>{card.title}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--muted)", margin: 0 }}>
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Open Roles & Application Layout */}
      <section id="openings" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        {/* Filter Bar */}
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 6, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, alignItems: "center" }}>
            <input
              type="text"
              placeholder="🔍 Search roles by title, department, location, skills…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, width: "100%" }}
            />

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, width: "100%" }}
            >
              <option value="all">All Departments</option>
              {availableDepts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, width: "100%" }}
            >
              <option value="all">All Work Modes</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, width: "100%" }}
            >
              <option value="all">All Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 36, alignItems: "start" }}>
          {/* Left: Open Positions List */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
              <h2 style={{ font: "28px var(--font-display)", color: "var(--purple)", margin: 0 }}>Open Opportunities</h2>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{filteredJobs.length} active roles</span>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: "center", background: "#fff", border: "1px solid var(--line)", borderRadius: 4, color: "var(--muted)" }}>
                  Loading opportunities…
                </div>
              ) : filteredJobs.length === 0 ? (
                <div style={{ background: "#fff", border: "1px dashed var(--line)", padding: 36, borderRadius: 4, textAlign: "center" }}>
                  <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>🔍</span>
                  <h3 style={{ font: "20px var(--font-display)", color: "var(--purple)", margin: "0 0 6px" }}>
                    No Current Openings Found
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
                    No roles matched your specific search filters. You can reset filters or submit your CV directly to our talent pool.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    style={{
                      padding: "8px 16px",
                      background: "var(--purple)",
                      color: "#D4AF37",
                      border: "none",
                      borderRadius: 3,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      marginRight: 10,
                    }}
                  >
                    Reset Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyClick("General Application / Talent Pool")}
                    style={{
                      padding: "8px 16px",
                      background: "#faf8f5",
                      color: "var(--purple)",
                      border: "1px solid var(--purple)",
                      borderRadius: 3,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Submit General Application →
                  </button>
                </div>
              ) : (
                filteredJobs.map((pos) => (
                  <div
                    key={pos.id}
                    style={{
                      background: "#fff",
                      border: selectedRole === pos.title ? "2px solid #D4AF37" : "1px solid var(--line)",
                      padding: 24,
                      borderRadius: 4,
                      transition: "border 0.2s, box-shadow 0.2s",
                      boxShadow: selectedRole === pos.title ? "0 4px 18px rgba(212,175,55,0.15)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#D4AF37" }}>
                          {pos.department}
                        </span>
                        <h3 style={{ font: "20px var(--font-display)", color: "var(--purple)", margin: "4px 0 0" }}>
                          {pos.title}
                        </h3>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 11, padding: "3px 8px", background: "#f0ebfa", color: "var(--purple)", fontWeight: 600, borderRadius: 3, whiteSpace: "nowrap" }}>
                          {pos.employmentType}
                        </span>
                        <span style={{ fontSize: 11, padding: "3px 8px", background: "#faf8f5", color: "var(--ink)", fontWeight: 500, borderRadius: 3, border: "1px solid var(--line)" }}>
                          {pos.workMode}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--muted)", margin: "10px 0 16px" }}>
                      {pos.description}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 14, flexWrap: "wrap", gap: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", gap: 14, flexWrap: "wrap" }}>
                        <span>📍 {pos.location}</span>
                        <span>⏳ {pos.experience}</span>
                        {pos.salaryRange && <span style={{ color: "var(--purple)", fontWeight: 600 }}>💰 {pos.salaryRange}</span>}
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Link
                          href={`/careers/job/${pos.slug}`}
                          style={{
                            padding: "6px 12px",
                            background: "#fff",
                            color: "var(--purple)",
                            border: "1px solid var(--line)",
                            borderRadius: 3,
                            fontSize: 12,
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          View Details ↗
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleApplyClick(pos.title, pos.jobId || pos.id)}
                          style={{
                            padding: "6px 14px",
                            background: selectedRole === pos.title ? "#2A0F3A" : "#fff",
                            color: selectedRole === pos.title ? "#D4AF37" : "var(--purple)",
                            border: "1px solid var(--purple)",
                            borderRadius: 3,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {selectedRole === pos.title ? "✓ Selected" : "Apply for Role →"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* General Application Card */}
              <div
                style={{
                  background: "#fdfbf7",
                  border: selectedRole === "General Application / Talent Pool" ? "2px solid #D4AF37" : "1px dashed var(--line)",
                  padding: 24,
                  borderRadius: 4,
                }}
              >
                <h3 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "0 0 6px" }}>
                  Don’t see your exact specialization?
                </h3>
                <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.6 }}>
                  Submit a general application. We frequently create dedicated roles for exceptional clinical, engineering, formulation, or commercial talent.
                </p>
                <button
                  type="button"
                  onClick={() => handleApplyClick("General Application / Talent Pool", "")}
                  style={{
                    padding: "6px 14px",
                    background: selectedRole === "General Application / Talent Pool" ? "var(--purple)" : "#fff",
                    color: selectedRole === "General Application / Talent Pool" ? "#D4AF37" : "var(--purple)",
                    border: "1px solid var(--purple)",
                    borderRadius: 3,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {selectedRole === "General Application / Talent Pool" ? "✓ Selected for General Application" : "Submit General Application →"}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Sticky Application Form */}
          <div ref={formRef} style={{ background: "#fff", border: "1px solid var(--line)", padding: 32, borderRadius: 6, position: "sticky", top: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Application Form
            </span>
            <h2 style={{ font: "24px var(--font-display)", color: "var(--purple)", margin: "4px 0 16px" }}>
              {selectedRole}
            </h2>

            {feedback && (
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: 4,
                  marginBottom: 20,
                  background: feedback.success ? "#e9f7e9" : "#fde8e8",
                  border: `1px solid ${feedback.success ? "#c3e6cb" : "#f8b4b4"}`,
                  color: feedback.success ? "#2e7d32" : "#b34141",
                  fontSize: 13,
                }}
              >
                <b>{feedback.success ? "✓ Application Received" : "✕ Submission Error"}</b>
                <p style={{ margin: "4px 0 0" }}>{feedback.msg}</p>
                {feedback.id && (
                  <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--ink)" }}>
                    Application Reference ID: <code>{feedback.id}</code>
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Position / Role Applied For *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedRole(val);
                    const matchingJob = jobs.find((j) => j.title === val);
                    setSelectedJobId(matchingJob ? matchingJob.jobId || matchingJob.id : "");
                  }}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                >
                  {jobs.map((p) => (
                    <option key={p.id} value={p.title}>{p.title} ({p.department})</option>
                  ))}
                  <option value="General Application / Talent Pool">General Application / Talent Pool</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. / Mr. / Ms. ..."
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Phone / Mobile *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    WhatsApp (Optional)
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Current City / Location
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. New Delhi, Mumbai"
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Years of Experience
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 5 Years"
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Current Company (Optional)
                  </label>
                  <input
                    type="text"
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    placeholder="e.g. Cipla, Sun Pharma"
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Highest Qualification
                  </label>
                  <input
                    type="text"
                    value={highestQualification}
                    onChange={(e) => setHighestQualification(e.target.value)}
                    placeholder="e.g. M.Pharm, Ph.D, MBA"
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    LinkedIn URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Portfolio / Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://..."
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Resume Upload File Box */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Attach Resume / Curriculum Vitae (PDF, DOC, DOCX — Max 10MB) *
                </label>
                <div
                  style={{
                    border: "1px dashed var(--line)",
                    padding: 16,
                    borderRadius: 4,
                    background: "#faf8f5",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    required={!resumeFile}
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setResumeFile(e.target.files[0]);
                      }
                    }}
                  />
                  {resumeFile ? (
                    <div>
                      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "var(--purple)" }}>
                        📄 {resumeFile.name}
                      </p>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        {(resumeFile.size / 1024 / 1024).toFixed(2)} MB · Click to change file
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "var(--purple)" }}>
                        📎 Click to browse and upload resume
                      </p>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        Supported formats: PDF, DOC, DOCX (Max: 10MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Cover Note / Introduction
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share a brief overview of your background, key clinical/technical achievements, and why you are interested in Queens Care Laboratories..."
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <input
                  type="checkbox"
                  id="consentCheckbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  style={{ marginTop: 3, accentColor: "var(--purple)" }}
                />
                <label htmlFor="consentCheckbox" style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
                  I agree that Queens Care Laboratories talent acquisition team may store and process my profile data for recruitment purposes per the privacy policy.
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "14px 24px",
                  background: "var(--purple)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: submitting ? "wait" : "pointer",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  boxShadow: "0 4px 14px rgba(42,15,58,0.25)",
                }}
              >
                {submitting ? "Submitting Application…" : "Submit Application →"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Recruitment Contact Section */}
      <section style={{ maxWidth: 1200, margin: "60px auto 0", padding: "0 20px" }}>
        <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 32, borderRadius: 6, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Talent Team Contact
            </span>
            <h3 style={{ font: "20px var(--font-display)", color: "var(--purple)", margin: "4px 0 8px" }}>
              Direct Recruitment Inquiries
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              Have questions regarding our laboratory research environment, clinical fellowships, or open requisitions?
            </p>
          </div>

          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            <p style={{ margin: 0 }}>
              <b>Email:</b> <a href={`mailto:${pageConfig?.recruitmentInfo?.email || "careers@queenscare.in"}`} style={{ color: "var(--purple)" }}>{pageConfig?.recruitmentInfo?.email || "careers@queenscare.in"}</a>
            </p>
            <p style={{ margin: 0 }}>
              <b>Phone:</b> {pageConfig?.recruitmentInfo?.phone || "+91 (0) 11 4988 7700"}
            </p>
            <p style={{ margin: 0 }}>
              <b>Campus:</b> {pageConfig?.recruitmentInfo?.address || "Queens Care Research & Formulations Campus, New Delhi"}
            </p>
          </div>
        </div>
      </section>
      <QueensCareFooter />
    </div>
  );
}