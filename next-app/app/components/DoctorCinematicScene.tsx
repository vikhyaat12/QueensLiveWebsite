"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   DoctorCinematicScene — Queens Care Laboratories
   Cinematic doctor entrance and welcoming sequence using the verified
   high-definition animation video asset:
   public/uploads/assets/login/doctor-login-scene.mp4

   Visual choreography (measured from the current 10.006s asset):
   0.00s – 3.20s: Doctor enters carrying branded Queens Care medical bag.
   3.20s – 4.50s: Doctor places medical bag down, steps forward.
   4.50s – 6.60s: Bag opens, purple/gold glow emerges from bag interior.
   6.60s – 7.60s: Doctor turns toward the audience, then to the RIGHT.
   7.85s: Doctor begins the welcoming hand gesture toward the RIGHT.
   7.85s – 8.20s: Login card emerges inside the right frame; doctor settles
                  into her final welcoming presentation pose.
   8.20s+: Video holds stable final welcoming pose presenting the login stage.

   Cropping protection:
   - Uses object-fit: contain to preserve the complete 16:9 composition.
   - Zero cropping of head, hair bun, face, shoulders, hands, legs,
     feet, or medical bag.
   - Blended with matching royal purple studio backdrop (#150625).
   ═══════════════════════════════════════════════════════════════════════ */

export type DoctorCinematicConfig = {
  enabled: boolean;
  assetUrl?: string;
  size?: "sm" | "md" | "lg";
  position?: "left" | "center" | "right";
  entranceEnabled?: boolean;
  walkEnabled?: boolean;
  bagAnimationEnabled?: boolean;
  revealEnabled?: boolean;
  animationEnabled?: boolean;
  speed?: number;
  intensity?: number;
  bagEnabled?: boolean;
  bagAssetUrl?: string;
  coatLogoUrl?: string;
  bagLogoUrl?: string;
};

export type DoctorCinematicHandle = {
  skipToIdle: () => void;
};

export type DoctorCinematicProps = {
  config?: DoctorCinematicConfig;
  reducedMotion: boolean;
  onReveal: (mouth?: DOMRect | null) => void;
  celebrate?: boolean;
  formFocus?: "email" | "password" | "name" | null;
  authTab?: "login" | "register";
  forgotMode?: boolean;
  authLoading?: boolean;
  authMessage?: string;
};

/* ═══════════════════════════════════════════════════════════════════════
   DOCTOR CINEMATIC TIMING CONFIGURATION (MEASURED FROM ACTIVE VIDEO)
   Asset: public/uploads/assets/login/doctor-login-scene.mp4
   Duration: 10.005 seconds (1280 × 720, 16:9)

   Timeline breakdown:
   - 0.00s – 3.20s: Doctor enters carrying the Queens Care medical bag.
   - 3.20s – 4.50s: Doctor places medical bag down onto the floor.
   - 4.50s – 6.60s: Bag opens, purple magical glow & sparkles emit.
   - 6.60s – 7.60s: Doctor steps forward next to bag, turning to audience.
   - 7.75s: Doctor begins raising her right arm away from hip.
   - 7.85s: Doctor raises forearm & extends hand in welcoming gesture toward RIGHT.
   - 8.10s – 8.20s: Doctor settles into holding welcoming presentation pose.
   ═══════════════════════════════════════════════════════════════════════ */
export const DOCTOR_SCENE_TIMING = {
  VIDEO_PATH: "/uploads/assets/login/doctor-login-scene.mp4",
  VIDEO_DURATION: 10.005,

  // Exact timestamp immediately after doctor begins raising/extending hand toward the right
  LOGIN_REVEAL_TIME: 7.85,

  // Timestamp of the settled final welcoming presentation pose
  SETTLED_POSE_TIME: 8.20,

  // Maximum fallback timeout (ms) in case playback stalls or video fails to load
  SAFETY_FALLBACK_MS: 10500,

  // Autoplay blocked detection timeout (ms)
  AUTOPLAY_CHECK_MS: 2500,
} as const;

const DoctorCinematicScene = forwardRef<DoctorCinematicHandle, DoctorCinematicProps>(
  function DoctorCinematicScene(
    {
      config,
      reducedMotion,
      onReveal,
      celebrate,
      formFocus,
    },
    ref
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const revealedRef = useRef(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [playbackError, setPlaybackError] = useState(false);

    const triggerReveal = () => {
      if (!revealedRef.current) {
        revealedRef.current = true;
        onReveal(null);
      }
    };

    useImperativeHandle(ref, () => ({
      skipToIdle: () => {
        const v = videoRef.current;
        if (v) {
          try {
            v.currentTime = DOCTOR_SCENE_TIMING.SETTLED_POSE_TIME;
            v.pause();
          } catch {}
        }
        triggerReveal();
      },
    }));

    // Reduced motion or scene/entrance disabled — settle straight into the final welcoming pose
    useEffect(() => {
      if (reducedMotion || config?.entranceEnabled === false || config?.enabled === false) {
        const v = videoRef.current;
        if (v) {
          try {
            v.currentTime = DOCTOR_SCENE_TIMING.SETTLED_POSE_TIME;
            v.pause();
          } catch {}
        }
        triggerReveal();
      }
    }, [reducedMotion, config?.entranceEnabled, config?.enabled]);

    // Safety fallback timer: if video stalls or hangs, reveal anyway
    useEffect(() => {
      const fallback = setTimeout(() => {
        triggerReveal();
      }, DOCTOR_SCENE_TIMING.SAFETY_FALLBACK_MS);
      return () => clearTimeout(fallback);
    }, []);

    // Autoplay blocked detection: if paused at 0s after timeout, reveal immediately
    useEffect(() => {
      const autoplayCheck = setTimeout(() => {
        const v = videoRef.current;
        // Small tolerance: a freshly seeked video can report a non-zero
        // currentTime even when playback never started.
        if (v && v.paused && v.currentTime < 0.05 && !revealedRef.current) {
          triggerReveal();
        }
      }, DOCTOR_SCENE_TIMING.AUTOPLAY_CHECK_MS);
      return () => clearTimeout(autoplayCheck);
    }, []);

    // Any keypress immediately skips to final pose and reveals login
    useEffect(() => {
      const handleUserAction = () => {
        const v = videoRef.current;
        if (v && v.currentTime < DOCTOR_SCENE_TIMING.LOGIN_REVEAL_TIME) {
          try {
            v.currentTime = DOCTOR_SCENE_TIMING.SETTLED_POSE_TIME;
            v.pause();
          } catch {}
        }
        triggerReveal();
      };

      window.addEventListener("keydown", handleUserAction, { passive: true });
      return () => window.removeEventListener("keydown", handleUserAction);
    }, []);

    // Touch/click devices: any tap anywhere skips ahead to the final pose and
    // reveals login. Without this, touch users could never bypass the intro.
    useEffect(() => {
      const handleTouchSkip = () => {
        const v = videoRef.current;
        if (v && v.currentTime < DOCTOR_SCENE_TIMING.LOGIN_REVEAL_TIME) {
          try {
            v.currentTime = DOCTOR_SCENE_TIMING.SETTLED_POSE_TIME;
            v.pause();
          } catch {}
        }
        triggerReveal();
      };

      window.addEventListener("pointerdown", handleTouchSkip, { passive: true });
      return () => window.removeEventListener("pointerdown", handleTouchSkip);
    }, []);

    const handleTimeUpdate = () => {
      const v = videoRef.current;
      if (!v) return;

      // Reveal card at ~7.85s immediately after doctor begins welcoming gesture toward right
      if (v.currentTime >= DOCTOR_SCENE_TIMING.LOGIN_REVEAL_TIME) {
        triggerReveal();
      }
    };

    const handleEnded = () => {
      const v = videoRef.current;
      if (v) {
        try {
          v.currentTime = DOCTOR_SCENE_TIMING.SETTLED_POSE_TIME;
          v.pause();
        } catch {}
      }
      triggerReveal();
    };

    const handleLoadedMetadata = () => {
      setVideoLoaded(true);
      const v = videoRef.current;
      if (v && (reducedMotion || config?.entranceEnabled === false)) {
        v.currentTime = DOCTOR_SCENE_TIMING.SETTLED_POSE_TIME;
        v.pause();
      }
    };

    const handleError = () => {
      setPlaybackError(true);
      triggerReveal();
    };

    return (
      <div className="qc-cinematic-scene-wrap" aria-hidden="true">
        <style>{`
          .qc-cinematic-scene-wrap {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            background: #150625;
          }
          .qc-cinematic-video {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
            opacity: ${videoLoaded ? 1 : 0};
            transition: opacity 0.5s ease-in-out;
          }
        `}</style>

        <video
          ref={videoRef}
          src={DOCTOR_SCENE_TIMING.VIDEO_PATH}
          className="qc-cinematic-video"
          autoPlay={!reducedMotion && config?.entranceEnabled !== false}
          muted
          playsInline
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
        />
      </div>
    );
  }
);

DoctorCinematicScene.displayName = "DoctorCinematicScene";

export default DoctorCinematicScene;
