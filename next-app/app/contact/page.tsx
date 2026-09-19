"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import QueensCareHeader from "@/app/components/QueensCareHeader";
import QueensCareFooter from "@/app/components/QueensCareFooter";

interface CompanyInfo {
  legalName?: string;
  tradeName?: string;
  supportEmail?: string;
  supportPhone?: string;
  registeredAddress?: string;
  operationalAddress?: string;
  grievanceOfficerName?: string;
  grievanceOfficerEmail?: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "General Inquiry",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.company_info) {
          setCompanyInfo(data.company_info as CompanyInfo);
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: `[${formData.category}] ${formData.subject || "Customer Inquiry"}`,
          message: `${formData.message}${formData.phone ? `\n\nContact Phone: ${formData.phone}` : ""}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to send your message. Please try again.");
      }

      setStatusMessage({
        type: "success",
        text: "Thank you for contacting Queens Care Laboratories. Our care team has received your inquiry and will respond within 24 business hours.",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        category: "General Inquiry",
        message: "",
      });
    } catch (err: unknown) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#FAF8F5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <QueensCareHeader activePage="about" />

      <main style={{ flex: 1, padding: "48px 24px 80px", maxWidth: 1140, margin: "0 auto", width: "100%" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 28 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#2A0F3A",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: ".04em",
              textTransform: "uppercase",
            }}
          >
            ← Return to Queens Care
          </Link>
        </div>

        {/* Page Hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 999,
              background: "rgba(42, 15, 58, 0.06)",
              color: "#2A0F3A",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            <span>✉️</span> Dedicated Care &amp; Clinical Support
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display, serif)",
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 800,
              color: "#1E1638",
              margin: "0 0 14px",
            }}
          >
            How Can We Assist You?
          </h1>
          <p style={{ fontSize: 16, color: "#64748B", maxWidth: 620, margin: "0 auto", lineHeight: 1.6 }}>
            Whether you have questions regarding your formulation, batch verification, order status, or clinical partnerships, our dedicated team is here to help.
          </p>
        </div>

        {/* Grid: Contact Channels + Form */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 36,
            alignItems: "start",
          }}
        >
          {/* Left Column: Communication Channels & Office Information */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Channel Card 1: Direct Support */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 14,
                padding: "26px",
                border: "1px solid #EAE6DF",
                boxShadow: "0 4px 16px rgba(42, 15, 58, 0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "rgba(212, 175, 55, 0.12)",
                    color: "#D4AF37",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  💬
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1E1638", margin: 0 }}>
                    Customer Care Team
                  </h3>
                  <span style={{ fontSize: 12, color: "#10B981", fontWeight: 600 }}>
                    Mon–Sat: 9:00 AM – 6:00 PM IST
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, margin: "0 0 14px" }}>
                For order tracking, formulation usage guidance, address updates, or replacement requests.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
                <div>
                  <strong style={{ color: "#1E1638" }}>Email: </strong>
                  <a
                    href={`mailto:${companyInfo?.supportEmail || "care@queenscare.in"}`}
                    style={{ color: "#2A0F3A", fontWeight: 600, textDecoration: "none" }}
                  >
                    {companyInfo?.supportEmail || "care@queenscare.in"}
                  </a>
                </div>
                {companyInfo?.supportPhone && (
                  <div>
                    <strong style={{ color: "#1E1638" }}>Phone: </strong>
                    <a
                      href={`tel:${companyInfo.supportPhone}`}
                      style={{ color: "#2A0F3A", fontWeight: 600, textDecoration: "none" }}
                    >
                      {companyInfo.supportPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Channel Card 2: Grievance Officer */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 14,
                padding: "26px",
                border: "1px solid #EAE6DF",
                boxShadow: "0 4px 16px rgba(42, 15, 58, 0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "rgba(42, 15, 58, 0.08)",
                    color: "#2A0F3A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  ⚖️
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1E1638", margin: 0 }}>
                    Regulatory &amp; Grievance
                  </h3>
                  <span style={{ fontSize: 12, color: "#64748B" }}>
                    DPDP Act 2023 &amp; Statutory Compliance
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, margin: "0 0 14px" }}>
                Dedicated channel for statutory compliance, consumer grievance redressal, and data privacy requests.
              </p>
              <div style={{ fontSize: 14, color: "#4B5563" }}>
                {companyInfo?.grievanceOfficerName && (
                  <div style={{ marginBottom: 4 }}>
                    <strong style={{ color: "#1E1638" }}>Officer: </strong>
                    {companyInfo.grievanceOfficerName}
                  </div>
                )}
                <div>
                  <strong style={{ color: "#1E1638" }}>Email: </strong>
                  <a
                    href={`mailto:${companyInfo?.grievanceOfficerEmail || companyInfo?.supportEmail || "care@queenscare.in"}`}
                    style={{ color: "#2A0F3A", fontWeight: 600, textDecoration: "none" }}
                  >
                    {companyInfo?.grievanceOfficerEmail || companyInfo?.supportEmail || "care@queenscare.in"}
                  </a>
                </div>
              </div>
            </div>

            {/* Registered & Operational Address */}
            {(companyInfo?.registeredAddress || companyInfo?.operationalAddress) && (
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 14,
                  padding: "26px",
                  border: "1px solid #EAE6DF",
                  boxShadow: "0 4px 16px rgba(42, 15, 58, 0.03)",
                }}
              >
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1E1638", margin: "0 0 10px" }}>
                  📍 Registered Office
                </h4>
                <p style={{ fontSize: 13.5, color: "#64748B", lineHeight: 1.6, margin: 0 }}>
                  {companyInfo.registeredAddress || companyInfo.operationalAddress}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Contact Message Form */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              padding: "32px",
              border: "1px solid #EAE6DF",
              boxShadow: "0 8px 24px rgba(42, 15, 58, 0.04)",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display, serif)",
                fontSize: 24,
                fontWeight: 700,
                color: "#1E1638",
                margin: "0 0 8px",
              }}
            >
              Send Us a Message
            </h2>
            <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 24px" }}>
              Fill in your details below and an authorized care specialist will respond directly to your email.
            </p>

            {statusMessage && (
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: 8,
                  marginBottom: 20,
                  fontSize: 14,
                  lineHeight: 1.5,
                  background: statusMessage.type === "success" ? "#ECFDF5" : "#FEF2F2",
                  color: statusMessage.type === "success" ? "#065F46" : "#991B1B",
                  border: `1px solid ${statusMessage.type === "success" ? "#A7F3D0" : "#FECACA"}`,
                }}
              >
                {statusMessage.type === "success" ? "✓ " : "⚠️ "}
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label
                  htmlFor="name"
                  style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}
                >
                  Full Name <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma or Priya Patel"
                  value={formData.name}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 8,
                    border: "1px solid #D1D5DB",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label
                    htmlFor="email"
                    style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}
                  >
                    Email Address <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 8,
                      border: "1px solid #D1D5DB",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}
                  >
                    Phone Number (Optional)
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 8,
                      border: "1px solid #D1D5DB",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="category"
                  style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}
                >
                  Inquiry Nature
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 8,
                    border: "1px solid #D1D5DB",
                    fontSize: 14,
                    background: "#FFFFFF",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="Order & Delivery Support">Order &amp; Delivery Support</option>
                  <option value="Product Formulation Guidance">Product Formulation Guidance</option>
                  <option value="Doctor & Clinic Partnership">Doctor &amp; Clinic Partnership</option>
                  <option value="Institutional & B2B Supply">Institutional &amp; B2B Supply</option>
                  <option value="Grievance & Privacy">Grievance &amp; Privacy</option>
                  <option value="General Inquiry">General Inquiry</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}
                >
                  Subject
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="Summary of your request or order ID"
                  value={formData.subject}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 8,
                    border: "1px solid #D1D5DB",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}
                >
                  Detailed Message <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="Please describe how we can assist you..."
                  value={formData.message}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: "1px solid #D1D5DB",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "14px 28px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #D4AF37 0%, #B45309 100%)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: 15,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 14px rgba(212, 175, 55, 0.3)",
                  transition: "all 0.2s ease",
                  opacity: loading ? 0.7 : 1,
                  marginTop: 6,
                }}
              >
                {loading ? "Transmitting..." : "Send Message to Care Team →"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <QueensCareFooter />
    </div>
  );
}

