"use client";

import React, { useState, useEffect } from "react";

interface IntegrationItem {
  id: string;
  name: string;
  purpose: string;
  category: string;
  activeProvider: string;
  status: "active" | "development_simulated" | "disabled" | "unconfigured";
  mode: "production" | "sandbox" | "test" | "production_cloud" | "local_storage";
  maskedSecret: string;
  senderIdentity: string;
  canTest: boolean;
}

export default function IntegrationsManagerPanel() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const loadIntegrations = async () => {
    try {
      const res = await fetch("/api/admin/integrations");
      const data = await res.json();
      if (data.integrations) {
        setIntegrations(data.integrations);
      }
    } catch (e) {
      console.error("Failed to fetch integrations:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const runTest = async (item: IntegrationItem) => {
    setTestingId(item.id);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", targetId: item.id }),
      });
      const data = await res.json();
      if (data.testResult) {
        setTestResult({
          id: item.id,
          success: data.testResult.success,
          message: data.testResult.message,
        });
      }
    } catch {
      setTestResult({
        id: item.id,
        success: false,
        message: "Diagnostic probe timed out or network error.",
      });
    } finally {
      setTestingId(null);
    }
  };

  const categories = ["All", "Communications", "Finance", "Analytics & Marketing", "Operations", "Infrastructure", "Security"];

  const filtered = integrations.filter(
    (i) =>
      (selectedCategory === "All" || i.category === selectedCategory) &&
      (i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.purpose.toLowerCase().includes(search.toLowerCase()) ||
        i.activeProvider.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 24, borderRadius: 6, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
            Platform & Infrastructure
          </span>
          <h3 style={{ font: "22px var(--font-display)", color: "var(--purple)", margin: "2px 0 0" }}>
            🔌 Integration & Communications Control Center
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Central operations desk to monitor, test, and audit all connected third-party providers (Email, SMS, WhatsApp, Gateways, Storage).
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setLoading(true); loadIntegrations(); }}
          style={{
            padding: "8px 16px",
            background: "#f4f1ea",
            border: "1px solid #e0dacb",
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--purple)",
            cursor: "pointer",
          }}
        >
          🔄 Refresh Diagnostic State
        </button>
      </div>

      {/* Test Result Toast */}
      {testResult && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: 20,
            borderRadius: 6,
            background: testResult.success ? "#edf7ed" : "#fdeded",
            border: `1px solid ${testResult.success ? "#c8e6c9" : "#ffcdd2"}`,
            color: testResult.success ? "#1e4620" : "#5f2120",
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <strong>{testResult.success ? "✓ Probe Succeeded:" : "⚠ Diagnostic Error:"}</strong> {testResult.message}
          </div>
          <button
            type="button"
            onClick={() => setTestResult(null)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "inherit" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter / Search & Category Pills */}
      <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter integrations by name, provider, category..."
          style={{
            width: "100%",
            maxWidth: 400,
            padding: "8px 12px",
            border: "1px solid var(--line)",
            borderRadius: 4,
            fontSize: 13,
          }}
        />

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: "1px solid",
                borderColor: selectedCategory === cat ? "var(--purple)" : "#E5DECF",
                background: selectedCategory === cat ? "var(--purple)" : "#FAF8F5",
                color: selectedCategory === cat ? "#D4AF37" : "#555",
                fontSize: 12,
                fontWeight: selectedCategory === cat ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Integrations Table */}
      {loading ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: "#888" }}>
          Running live provider diagnostics…
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#FAF8F5", borderBottom: "2px solid #eae5d9", textAlign: "left" }}>
                <th style={{ padding: "12px 14px", fontWeight: 700, color: "var(--purple)" }}>Service & Purpose</th>
                <th style={{ padding: "12px 14px", fontWeight: 700, color: "var(--purple)" }}>Category</th>
                <th style={{ padding: "12px 14px", fontWeight: 700, color: "var(--purple)" }}>Active Provider</th>
                <th style={{ padding: "12px 14px", fontWeight: 700, color: "var(--purple)" }}>Status & Mode</th>
                <th style={{ padding: "12px 14px", fontWeight: 700, color: "var(--purple)" }}>Credentials (Masked)</th>
                <th style={{ padding: "12px 14px", fontWeight: 700, color: "var(--purple)", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isTesting = testingId === item.id;
                const isProd = item.mode === "production" || item.mode === "production_cloud";

                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f0ebe1" }}>
                    <td style={{ padding: "14px", maxWidth: 280 }}>
                      <div style={{ fontWeight: 700, color: "var(--purple)", fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{item.purpose}</div>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: "#f0e9d8",
                          color: "#6b582a",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <code style={{ background: "#f5f5f5", padding: "3px 6px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                        {item.activeProvider}
                      </code>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            width: "fit-content",
                            background:
                              item.status === "active"
                                ? "#e8f5e9"
                                : item.status === "development_simulated"
                                ? "#fff8e1"
                                : "#ffebee",
                            color:
                              item.status === "active"
                                ? "#2e7d32"
                                : item.status === "development_simulated"
                                ? "#f57f17"
                                : "#c62828",
                          }}
                        >
                          {item.status.toUpperCase().replace("_", " ")}
                        </span>
                        <span style={{ fontSize: 11, color: isProd ? "#2e7d32" : "#888" }}>
                          ● {item.mode.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 12, color: "#444" }}>{item.maskedSecret}</div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>ID: {item.senderIdentity}</div>
                    </td>
                    <td style={{ padding: "14px", textAlign: "right" }}>
                      {item.canTest && (
                        <button
                          type="button"
                          onClick={() => runTest(item)}
                          disabled={isTesting}
                          style={{
                            padding: "6px 14px",
                            background: isTesting ? "#eee" : "var(--purple)",
                            color: isTesting ? "#888" : "#D4AF37",
                            border: "none",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isTesting ? "wait" : "pointer",
                          }}
                        >
                          {isTesting ? "Testing…" : "⚡ Test Probe"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Security & Secrets Note */}
      <div
        style={{
          marginTop: 24,
          padding: 14,
          background: "#faf9f7",
          border: "1px dashed #d8cfbe",
          borderRadius: 6,
          fontSize: 12,
          color: "#666",
        }}
      >
        🔒 <strong>Enterprise Secret Protection Active:</strong> Production API keys, webhook secrets, and private signing tokens are encrypted and isolated on the secure server runtime. They are never rendered in client HTML or transmitted over unauthenticated endpoints.
      </div>
    </div>
  );
}
