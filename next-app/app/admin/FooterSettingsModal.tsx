"use client";

import React from "react";
import FooterBuilder from "./FooterBuilder";

export default function FooterSettingsModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave?: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#F3F4F6",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "1300px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            background: "#1C0A2E",
            color: "#FFFFFF",
            borderTopLeftRadius: "12px",
            borderTopRightRadius: "12px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🦶</span>
            <span style={{ fontSize: "16px", fontWeight: 700 }}>Global Footer CMS &amp; Builder</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onSave) onSave();
              onClose();
            }}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              color: "#FFFFFF",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          <FooterBuilder />
        </div>
      </div>
    </div>
  );
}
