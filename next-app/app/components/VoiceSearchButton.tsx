"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export type VoiceState =
  | "idle"
  | "listening"
  | "processing"
  | "result"
  | "no_result"
  | "permission_denied"
  | "unsupported"
  | "error";

interface VoiceSearchButtonProps {
  onResult: (text: string) => void;
  onInterim?: (text: string) => void;
  onStateChange?: (state: VoiceState, message?: string) => void;
  size?: number;
  className?: string;
  autoStart?: boolean;
}

/**
 * Normalizes spoken healthcare phrases and numbers.
 * E.g. "paracetamol five hundred" -> "paracetamol 500"
 * E.g. "vitamin c thirty ml" -> "vitamin c 30ml"
 */
export function normalizeSpokenQuery(spoken: string): string {
  let text = spoken.trim();

  const numberWords: Record<string, string> = {
    zero: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    ten: "10",
    twenty: "20",
    thirty: "30",
    forty: "40",
    fifty: "50",
    sixty: "60",
    seventy: "70",
    eighty: "80",
    ninety: "90",
    hundred: "100",
    thousand: "1000",
  };

  // Replace common compound phrases
  text = text.replace(/\bfive hundred\b/gi, "500");
  text = text.replace(/\bsix hundred fifty\b/gi, "650");
  text = text.replace(/\btwo hundred\b/gi, "200");
  text = text.replace(/\bone thousand\b/gi, "1000");
  text = text.replace(/\bthree hundred\b/gi, "300");
  text = text.replace(/\bfifty\b/gi, "50");
  text = text.replace(/\bthirty\b/gi, "30");
  text = text.replace(/\bsixty\b/gi, "60");

  // Replace individual spoken numbers
  for (const [word, digit] of Object.entries(numberWords)) {
    const reg = new RegExp(`\\b${word}\\b`, "gi");
    text = text.replace(reg, digit);
  }

  // Normalize pharmaceutical units
  text = text.replace(/\bmilligrams?\b/gi, "mg");
  text = text.replace(/\bmilliliters?\b/gi, "ml");
  text = text.replace(/\bgrams?\b/gi, "g");
  text = text.replace(/\bpercent\b/gi, "%");
  text = text.replace(/\s+(mg|ml|g|%)\b/gi, "$1");

  return text.trim();
}

// Global typing for Web Speech API
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export default function VoiceSearchButton({
  onResult,
  onInterim,
  onStateChange,
  size = 40,
  className = "",
  autoStart = false,
}: VoiceSearchButtonProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [supported, setSupported] = useState<boolean>(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateState = useCallback(
    (newState: VoiceState, message = "") => {
      setState(newState);
      setFeedbackMessage(message);
      if (onStateChange) onStateChange(newState, message);

      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (["result", "no_result", "permission_denied", "error"].includes(newState)) {
        feedbackTimerRef.current = setTimeout(() => {
          setState("idle");
          setFeedbackMessage("");
          if (onStateChange) onStateChange("idle");
        }, 4000);
      }
    },
    [onStateChange]
  );

  // Check browser support on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) {
      setSupported(false);
      updateState("unsupported", "Voice search not supported on this browser.");
    }
  }, [updateState]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) {
      updateState("unsupported", "Voice search is not supported in this browser. Please type your search.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    try {
      const recognition = new SpeechAPI() as SpeechRecognitionInstance;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN"; // Default to Indian English, handles local names and formulations well

      recognition.onstart = () => {
        updateState("listening", "Listening… speak a medicine, ingredient, or symptom");
      };

      let finalRecognized = "";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i][0];
          if (event.results[i].isFinal) {
            finalRecognized += item.transcript;
          } else {
            interim += item.transcript;
          }
        }

        const candidate = finalRecognized || interim;
        if (candidate && onInterim) {
          onInterim(candidate);
        }

        if (finalRecognized) {
          updateState("processing", "Processing speech…");
          const normalized = normalizeSpokenQuery(finalRecognized);
          onResult(normalized);
          updateState("result", `Recognized: "${normalized}"`);
        }
      };

      recognition.onerror = (event: { error: string }) => {
        const err = event.error;
        if (err === "not-allowed" || err === "permission-denied") {
          updateState(
            "permission_denied",
            "Microphone permission blocked. Please allow microphone access in your browser settings."
          );
        } else if (err === "no-speech") {
          updateState("no_result", "No speech detected. Please tap microphone and try again.");
        } else if (err === "network") {
          updateState("error", "Network speech service unavailable. Please use the keyboard.");
        } else {
          updateState("error", `Voice recognition interrupted (${err}). Please try again.`);
        }
      };

      recognition.onend = () => {
        // If ended without final results or error
        if (state === "listening") {
          if (!finalRecognized) {
            updateState("no_result", "No speech detected. Tap microphone to try again.");
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Speech recognition initialization failed:", err);
      updateState("error", "Unable to start voice search. Please use keyboard search.");
    }
  }, [onInterim, onResult, state, updateState]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    updateState("idle");
  }, [updateState]);

  // Handle auto-start if requested
  useEffect(() => {
    if (autoStart && supported) {
      const timer = setTimeout(() => {
        startListening();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [autoStart, supported, startListening]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (state === "listening") {
      stopListening();
    } else {
      startListening();
    }
  };

  const isListening = state === "listening";
  const isProcessing = state === "processing";

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }} className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={!supported}
        aria-label={
          isListening
            ? "Stop listening"
            : supported
            ? "Search using voice input"
            : "Voice search not supported"
        }
        title={
          isListening
            ? "Listening… click to stop"
            : supported
            ? "Search using voice (English / Hindi)"
            : "Voice search unsupported in this browser"
        }
        style={{
          width: size,
          height: size,
          minWidth: 44, // Strict touch target accessibility minimum
          minHeight: 44,
          borderRadius: "50%",
          border: isListening ? "2px solid #9333EA" : "1px solid rgba(42, 15, 58, 0.15)",
          background: isListening
            ? "linear-gradient(135deg, #9333EA 0%, #2A0F3A 100%)"
            : isProcessing
            ? "#F3E8FF"
            : "#FFFFFF",
          color: isListening ? "#FFFFFF" : supported ? "#2A0F3A" : "#9CA3AF",
          cursor: supported ? "pointer" : "not-allowed",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: isListening ? "0 0 0 6px rgba(147, 51, 234, 0.25)" : "none",
          animation: isListening ? "qcVoicePulse 1.5s infinite" : "none",
          outline: "none",
          padding: 0,
        }}
      >
        {isListening ? (
          /* Active pulsing soundwave icon */
          <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
            <span style={{ display: "block", width: 3, height: 12, background: "#fff", borderRadius: 2, animation: "qcWave 0.8s infinite 0.1s" }} />
            <span style={{ display: "block", width: 3, height: 18, background: "#fff", borderRadius: 2, animation: "qcWave 0.8s infinite 0.2s" }} />
            <span style={{ display: "block", width: 3, height: 10, background: "#fff", borderRadius: 2, animation: "qcWave 0.8s infinite 0.3s" }} />
          </span>
        ) : isProcessing ? (
          <span style={{ fontSize: 15, animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
      </button>

      {/* Embedded CSS animations for voice pulsing */}
      <style>{`
        @keyframes qcVoicePulse {
          0% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(147, 51, 234, 0); }
          100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0); }
        }
        @keyframes qcWave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
