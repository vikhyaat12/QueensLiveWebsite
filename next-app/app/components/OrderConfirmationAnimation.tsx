"use client";

import { useEffect, useState } from "react";

/**
 * OrderConfirmationAnimation
 *
 * Adapted from the provided CodePen delivery-truck animation.
 * Pure CSS keyframe animation — no external dependencies.
 * Rebranded to Queens Care purple/gold palette.
 * Respects prefers-reduced-motion.
 */
export default function OrderConfirmationAnimation({ autoPlay = true }: { autoPlay?: boolean }) {
  const [animate, setAnimate] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (autoPlay && !reducedMotion) {
      // Small delay so the page transition settles first
      const t = setTimeout(() => setAnimate(true), 300);
      return () => clearTimeout(t);
    }
  }, [autoPlay, reducedMotion]);

  // Reduced-motion: skip the truck animation, just show the success state immediately
  if (reducedMotion) {
    return (
      <div className="oca-wrapper" role="img" aria-label="Order placed successfully">
        <div className="oca-reduced">
          <svg className="oca-reduced-check" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="25" stroke="var(--purple)" strokeWidth="2" fill="var(--purple)" />
            <polyline points="15 27 22 34 37 19" stroke="#e9c780" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="oca-reduced-text">Order Placed</span>
        </div>
        <style>{`
          .oca-reduced { display: flex; flex-direction: column; align-items: center; gap: 12px; }
          .oca-reduced-check { width: 52px; height: 52px; }
          .oca-reduced-text { font: 500 15px/1 var(--font-geist); color: var(--purple); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="oca-wrapper" role="img" aria-label="Order placed — delivery truck animation">
      <button
        className={`oca-order ${animate ? "oca-animate" : ""}`}
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={() => {
          if (!animate) {
            setAnimate(true);
            setTimeout(() => setAnimate(false), 10000);
          }
        }}
      >
        <span className="ocadefault">Order Confirmed</span>
        <span className="ocasuccess">Order Placed <svg viewBox="0 0 12 10"><polyline points="1.5 6 4.5 9 10.5 1" /></svg></span>
        <div className="oca-box" />
        <div className="oca-truck">
          <div className="oca-back" />
          <div className="oca-front">
            <div className="oca-window" />
          </div>
          <div className="oca-light oca-top" />
          <div className="oca-light oca-bottom" />
        </div>
        <div className="oca-lines" />
      </button>

      <style>{`
        .oca-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }
        .oca-order {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          border: 0;
          background: var(--purple, #1a0a2e);
          position: relative;
          height: 63px;
          width: 260px;
          padding: 0;
          outline: none;
          cursor: default;
          border-radius: 32px;
          -webkit-mask-image: -webkit-radial-gradient(white, black);
          -webkit-tap-highlight-color: transparent;
          overflow: hidden;
          transition: transform 0.3s ease;
        }
        .oca-order span {
          --o: 1;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          white-space: nowrap;
          line-height: 1;
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.02em;
          font-family: var(--font-geist, system-ui, sans-serif);
          opacity: var(--o);
          transition: opacity 0.25s ease;
          pointer-events: none;
        }
        .oca-order span.ocadefault {
          z-index: 3;
        }
        .oca-order span.ocasuccess {
          --offset: 16px;
          --o: 0;
          z-index: 4;
          color: #fff;
        }
        .oca-order span.ocasuccess svg {
          width: 14px;
          height: 11px;
          flex-shrink: 0;
          fill: none;
          stroke: #e9c780;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 16px;
          stroke-dashoffset: var(--offset);
          transition: stroke-dashoffset 0.4s ease 0.1s;
        }
        .oca-lines {
          opacity: 0;
          position: absolute;
          height: 3px;
          background: #fff;
          border-radius: 2px;
          width: 6px;
          top: 30px;
          left: 100%;
          box-shadow: 15px 0 0 #fff, 30px 0 0 #fff, 45px 0 0 #fff, 60px 0 0 #fff, 75px 0 0 #fff, 90px 0 0 #fff, 105px 0 0 #fff, 120px 0 0 #fff, 135px 0 0 #fff, 150px 0 0 #fff, 165px 0 0 #fff, 180px 0 0 #fff, 195px 0 0 #fff, 210px 0 0 #fff, 225px 0 0 #fff, 240px 0 0 #fff, 255px 0 0 #fff, 270px 0 0 #fff, 285px 0 0 #fff, 300px 0 0 #fff, 315px 0 0 #fff, 330px 0 0 #fff;
        }
        .oca-back, .oca-box {
          --start: #e9c780;
          --stop: #d4a84a;
          border-radius: 2px;
          background: linear-gradient(var(--start), var(--stop));
          position: absolute;
        }
        .oca-truck {
          width: 60px;
          height: 41px;
          left: 100%;
          z-index: 1;
          top: 11px;
          position: absolute;
          transform: translateX(24px);
        }
        .oca-truck:before, .oca-truck:after {
          --r: -90deg;
          content: "";
          height: 2px;
          width: 20px;
          right: 58px;
          position: absolute;
          display: block;
          background: #fff;
          border-radius: 1px;
          transform-origin: 100% 50%;
          transform: rotate(var(--r));
        }
        .oca-truck:before { top: 4px; }
        .oca-truck:after  { --r: 90deg; bottom: 4px; }
        .oca-back {
          left: 0;
          top: 0;
          width: 60px;
          height: 41px;
          z-index: 1;
        }
        .oca-front {
          overflow: hidden;
          position: absolute;
          border-radius: 2px 9px 9px 2px;
          width: 26px;
          height: 41px;
          left: 60px;
        }
        .oca-front:before {
          content: "";
          position: absolute;
          display: block;
          height: 13px;
          width: 2px;
          left: 0;
          top: 14px;
          background: linear-gradient(#6C7486, #3F4656);
        }
        .oca-front:after {
          content: "";
          position: absolute;
          border-radius: 2px 9px 9px 2px;
          background: #7c5cbf;
          width: 24px;
          height: 41px;
          right: 0;
        }
        .oca-window {
          overflow: hidden;
          border-radius: 2px 8px 8px 2px;
          background: #b39ddb;
          transform: perspective(4px) rotateY(3deg);
          width: 22px;
          height: 41px;
          position: absolute;
          left: 2px;
          top: 0;
          z-index: 1;
          transform-origin: 0 50%;
        }
        .oca-window:before {
          content: "";
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 14px;
          background: #1a0a2e;
        }
        .oca-window:after {
          content: "";
          position: absolute;
          right: 0;
          width: 14px;
          top: 7px;
          height: 4px;
          background: rgba(255, 255, 255, 0.14);
          transform: skewY(14deg);
          box-shadow: 0 7px 0 rgba(255, 255, 255, 0.14);
        }
        .oca-light {
          width: 3px;
          height: 8px;
          left: 83px;
          transform-origin: 100% 50%;
          position: absolute;
          border-radius: 2px;
          transform: scaleX(0.8);
          background: #f0dc5f;
        }
        .oca-light:before {
          content: "";
          height: 4px;
          width: 7px;
          opacity: 0;
          transform: perspective(2px) rotateY(-15deg) scaleX(0.94);
          position: absolute;
          transform-origin: 0 50%;
          left: 3px;
          top: 50%;
          margin-top: -2px;
          background: linear-gradient(90deg, #f0dc5f, rgba(240, 220, 95, 0.7), rgba(240, 220, 95, 0));
        }
        .oca-top { top: 4px; }
        .oca-bottom { bottom: 4px; }
        .oca-box {
          width: 21px;
          height: 21px;
          right: 100%;
          top: 21px;
        }
        .oca-box:before, .oca-box:after {
          content: "";
          top: 10px;
          position: absolute;
          left: 0;
          right: 0;
        }
        .oca-box:before { height: 3px; margin-top: -1px; background: rgba(0, 0, 0, 0.1); }
        .oca-box:after  { height: 1px; background: rgba(0, 0, 0, 0.15); }

        /* ---- animate state ---- */
        /* Same specificity as the base label rules and later in source, so the
           --o / --offset overrides win the cascade and the success label can fade in. */
        .oca-animate span.ocadefault {
          --o: 0;
          transition-delay: 0s;
          transition-duration: 0.15s;
        }
        .oca-animate span.ocasuccess {
          --offset: 0;
          --o: 1;
          transition-delay: 7.2s;
          transition-duration: 0.4s;
        }
        .oca-animate span.ocasuccess svg {
          transition-delay: 7.5s;
        }
        .oca-animate .oca-truck {
          animation: oca-truck 10s ease forwards;
        }
        .oca-animate .oca-truck:before {
          animation: oca-door1 2.4s ease forwards 0.3s;
        }
        .oca-animate .oca-truck:after {
          animation: oca-door2 2.4s ease forwards 0.6s;
        }
        .oca-animate .oca-light:before {
          animation: oca-light 10s ease forwards;
        }
        .oca-animate .oca-box {
          animation: oca-box 10s ease forwards;
        }
        .oca-animate .oca-lines {
          animation: oca-lines 10s ease forwards;
        }

        @keyframes oca-truck {
          10%, 30% { transform: translateX(-164px); }
          40%      { transform: translateX(-104px); }
          60%      { transform: translateX(-224px); }
          75%, 100%{ transform: translateX(24px); }
        }
        @keyframes oca-lines {
          0%, 30%  { opacity: 0; transform: scaleY(0.7) translateX(0); }
          35%, 65% { opacity: 1; }
          70%      { opacity: 0; }
          100%     { transform: scaleY(0.7) translateX(-400px); }
        }
        @keyframes oca-light {
          0%, 30%  { opacity: 0; transform: perspective(2px) rotateY(-15deg) scaleX(0.88); }
          40%, 100%{ opacity: 1; transform: perspective(2px) rotateY(-15deg) scaleX(0.94); }
        }
        @keyframes oca-door1 {
          30%, 50% { transform: rotate(32deg); }
        }
        @keyframes oca-door2 {
          30%, 50% { transform: rotate(-32deg); }
        }
        @keyframes oca-box {
          8%, 10%  { transform: translateX(40px); opacity: 1; }
          25%      { transform: translateX(112px); opacity: 1; }
          26%      { transform: translateX(112px); opacity: 0; }
          27%, 100%{ transform: translateX(0px); opacity: 0; }
        }

        @media (max-width: 650px) {
          .oca-order { width: 240px; height: 55px; }
          .oca-order span { font-size: 14px; }
        }
      `}</style>
    </div>
  );
}
