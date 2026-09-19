"use client";

import React, { useEffect, useState } from "react";

interface WhatsAppPublicConfig {
  enabled: boolean;
  phoneNumber?: string;
  displayLabel?: string;
  defaultMessage?: string;
  operatingHoursText?: string;
  position?: "bottom-right" | "bottom-left";
  pulseAnimation?: boolean;
  showTooltip?: boolean;
}

export default function WhatsAppConnect() {
  const [config, setConfig] = useState<WhatsAppPublicConfig | null>(null);
  const [hovered, setHovered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/whatsapp")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) {
          setConfig(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading || !config || !config.enabled || !config.phoneNumber) {
    return null;
  }

  // Clean phone number for wa.me URL (digits only)
  const cleanPhone = config.phoneNumber.replace(/[^\d]/g, "");
  const encodedMessage = encodeURIComponent(config.defaultMessage || "Hello Queens Care Laboratories, I would like to inquire about formulations.");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  const isLeft = config.position === "bottom-left";

  return (
    <>
      <div
        className="qc-whatsapp-float-wrap"
        style={{
          position: "fixed",
          bottom: "24px",
          [isLeft ? "left" : "right"]: "24px",
          zIndex: 99,
          display: "flex",
          alignItems: "center",
          flexDirection: isLeft ? "row-reverse" : "row",
          gap: "10px",
          pointerEvents: "auto",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Tooltip Pill */}
        {config.showTooltip && (
          <div
            className={`qc-whatsapp-tooltip ${hovered ? "qc-whatsapp-tooltip-visible" : ""}`}
            style={{
              background: "#1E1638",
              color: "#FFFFFF",
              padding: "8px 14px",
              borderRadius: "10px",
              boxShadow: "0 8px 24px rgba(30, 22, 56, 0.22)",
              fontSize: "12px",
              lineHeight: 1.35,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              opacity: hovered ? 1 : 0,
              transform: hovered ? "translateX(0)" : isLeft ? "translateX(-8px)" : "translateX(8px)",
              border: "1px solid rgba(212, 175, 55, 0.3)",
            }}
          >
            <div style={{ fontWeight: 700, color: "#FFFFFF", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
              {config.displayLabel || "Chat with Clinical Desk"}
            </div>
            {config.operatingHoursText && (
              <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.7)", marginTop: "2px" }}>
                {config.operatingHoursText}
              </div>
            )}
          </div>
        )}

        {/* Main WhatsApp Action Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={config.displayLabel || "Chat with Queens Care on WhatsApp"}
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 20px rgba(37, 211, 102, 0.4), 0 2px 6px rgba(0, 0, 0, 0.1)",
            position: "relative",
            textDecoration: "none",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: hovered ? "scale(1.08)" : "scale(1)",
          }}
        >
          {/* Pulsing Presence Ring */}
          {config.pulseAnimation && (
            <span
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#22C55E",
                border: "2px solid #FFFFFF",
                boxShadow: "0 0 0 rgba(34, 197, 94, 0.6)",
                animation: "qc-pulse-dot 2s infinite",
              }}
            />
          )}

          {/* Official WhatsApp SVG Icon */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ display: "block" }}
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </div>

      <style jsx global>{`
        @keyframes qc-pulse-dot {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
        @media (max-width: 768px) {
          .qc-whatsapp-float-wrap {
            bottom: 74px !important;
            right: 18px !important;
          }
          .qc-whatsapp-tooltip {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
