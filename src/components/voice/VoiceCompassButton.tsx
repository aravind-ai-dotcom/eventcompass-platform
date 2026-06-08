"use client";

// =============================================================================
// EventCompass — Voice Compass Button
// src/components/voice/VoiceCompassButton.tsx
//
// Push-to-talk concierge button for the My Experience page.
//
// Behaviour:
//   Idle      → "Ask Compass"  (user presses button)
//   Listening → "Listening…"  (browser captures speech, one exchange)
//   Thinking  → "Thinking…"   (intent classified, response built)
//   Result    → shows transcript + Compass response, speaks it aloud
//   Error     → shows specific error, returns to idle
//
// Architecture:
//   - Uses browser SpeechRecognition (webkit fallback) for speech-to-text
//   - Uses browser SpeechSynthesis for spoken response
//   - Uses voiceIntentClassifier.ts for deterministic intent matching
//   - No Firestore access — all data passed in as props
//   - No audio stored, uploaded, or transmitted
//   - Each press is a single exchange (mic never left open)
//
// Props:
//   nextBestMove          — current NBM from the experience page
//   topSession            — first scored session (for schedule queries)
//   topChampion           — first scored champion (for people queries)
//   onDismiss?            — callback when DISMISS intent fires
//   onMarkAttended?       — callback when MARK_ATTENDED intent fires
//   onNavigateExperience? — callback when FULL_SCHEDULE intent fires
//
// CSS: globals.css class names only.
// =============================================================================

import { useState, useCallback, useRef, useEffect } from "react";
import type { NextBestMove, ScoredSession, ScoredChampion } from "@/types";
import {
  classifyVoiceIntent,
  buildVoiceResponse,
  type VoiceResponse,
} from "@/services/voiceIntentClassifier";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type VoiceState = "idle" | "listening" | "thinking" | "result" | "error" | "unsupported";

interface VoiceCompassButtonProps {
  nextBestMove?:           NextBestMove | null;
  topSession?:             ScoredSession | null;
  topChampion?:            ScoredChampion | null;
  participantGoals?:       string[];
  participantTracks?:      string[];
  onDismiss?:              () => void;
  onMarkAttended?:         () => void;
  onNavigateExperience?:   () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Browser SpeechRecognition type shim
// The Web Speech API is not in TypeScript's lib — we declare it minimally.
// ─────────────────────────────────────────────────────────────────────────────

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult:  ((event: SpeechRecognitionEvent) => void) | null;
  onerror:   ((event: { error: string }) => void) | null;
  onend:     (() => void) | null;
  onstart:   (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

// ─────────────────────────────────────────────────────────────────────────────
// SpeechRecognition availability check
// ─────────────────────────────────────────────────────────────────────────────

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (
    (w.SpeechRecognition as SpeechRecognitionConstructor | undefined) ??
    (w.webkitSpeechRecognition as SpeechRecognitionConstructor | undefined) ??
    null
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pulsing dot animation — inline, no external deps
// ─────────────────────────────────────────────────────────────────────────────

function PulsingDot() {
  return (
    <span
      aria-hidden="true"
      style={{
        display:         "inline-block",
        width:           "8px",
        height:          "8px",
        borderRadius:    "50%",
        background:      "var(--accent)",
        marginRight:     "8px",
        animation:       "compass-pulse 1.2s ease-in-out infinite",
        verticalAlign:   "middle",
        flexShrink:      0,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function VoiceCompassButton({
  nextBestMove,
  topSession,
  topChampion,
  participantGoals,
  participantTracks,
  onDismiss,
  onMarkAttended,
  onNavigateExperience,
}: VoiceCompassButtonProps) {

  const [voiceState,  setVoiceState]  = useState<VoiceState>("idle");
  const [transcript,  setTranscript]  = useState("");
  const [response,    setResponse]    = useState<VoiceResponse | null>(null);
  const [errorMsg,    setErrorMsg]    = useState("");

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef       = useRef<SpeechSynthesisUtterance | null>(null);

  // Check support on mount
  useEffect(() => {
    if (!getSpeechRecognition()) {
      setVoiceState("unsupported");
    }
  }, []);

  // Cancel any pending speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.abort();
    };
  }, []);

  // ── Speak a response aloud ──────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance     = new SpeechSynthesisUtterance(text);
    utterance.lang      = "en-US";
    utterance.rate      = 0.95;
    utterance.pitch     = 1.0;
    utterance.volume    = 1.0;
    synthRef.current    = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  // ── Handle a resolved transcript ───────────────────────────────────────────
  const handleTranscript = useCallback((text: string) => {
    setVoiceState("thinking");
    setTranscript(text);

    // Small delay so the "Thinking…" state is visible
    setTimeout(() => {
      const classified = classifyVoiceIntent(text);
      const voiceResp  = buildVoiceResponse(classified, {
        nextBestMove:       nextBestMove      ?? null,
        topSession:         topSession        ?? null,
        topChampion:        topChampion       ?? null,
        participantGoals:   participantGoals  ?? [],
        participantTracks:  participantTracks ?? [],
      });

      setResponse(voiceResp);
      setVoiceState("result");
      speak(voiceResp.spoken);

      // Fire action callbacks
      if (voiceResp.action === "navigate_experience" && onNavigateExperience) {
        onNavigateExperience();
      }
      if (voiceResp.action === "dismiss" && onDismiss) {
        onDismiss();
      }
      if (voiceResp.action === "mark_attended" && onMarkAttended) {
        onMarkAttended();
      }
      if (voiceResp.action === "show_day" && onNavigateExperience) {
        onNavigateExperience();
      }
    }, 300);
  }, [
  nextBestMove,
  topSession,
  topChampion,
  participantGoals,
  participantTracks,
  speak,
  onDismiss,
  onMarkAttended,
  onNavigateExperience,
]);

  // ── Start listening ─────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setVoiceState("unsupported");
      return;
    }

    // Cancel any ongoing speech before listening
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setVoiceState("listening");
    setTranscript("");
    setResponse(null);
    setErrorMsg("");

    const recognition              = new SpeechRecognition();
    recognition.lang               = "en-US";
    recognition.interimResults     = false;
    recognition.maxAlternatives    = 1;
    recognition.continuous         = false; // Single exchange — mic closes after one result
    recognitionRef.current         = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0];
      if (result && result[0]) {
        const text = result[0].transcript.trim();
        if (text) handleTranscript(text);
      }
    };

    recognition.onerror = (event: { error: string }) => {
      const msg = ((): string => {
        switch (event.error) {
          case "no-speech":       return "No speech detected. Please try again.";
          case "audio-capture":   return "Microphone not available. Check browser permissions.";
          case "not-allowed":     return "Microphone access denied. Enable it in your browser settings.";
          case "network":         return "Network error. Speech recognition requires a connection.";
          case "aborted":         return "";  // User-initiated abort — silent
          default:                return `Speech error: ${event.error}`;
        }
      })();

      if (msg) {
        setErrorMsg(msg);
        setVoiceState("error");
      } else {
        setVoiceState("idle");
      }
    };

    recognition.onend = () => {
      // If still in listening state when recognition ends with no result,
      // return to idle rather than hanging
      setVoiceState((prev) => (prev === "listening" ? "idle" : prev));
    };

    recognition.start();
  }, [handleTranscript]);

  // ── Reset to idle ───────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    recognitionRef.current?.abort();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setVoiceState("idle");
    setTranscript("");
    setResponse(null);
    setErrorMsg("");
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const isListening  = voiceState === "listening";
  const isThinking   = voiceState === "thinking";
  const isBusy       = isListening || isThinking;
  const showResult   = voiceState === "result";
  const showError    = voiceState === "error";
  const unsupported  = voiceState === "unsupported";

  return (
    <>
    
      {/* Keyframe injection — scoped, no external stylesheet needed */}
      <style>{`
        @keyframes compass-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes compass-wave {
          0%, 100% { transform: scaleY(0.4); }
          50%       { transform: scaleY(1); }
        }
      `}</style>

<div
  style={{
    background: "transparent",
    padding: "24px 28px 28px",
  }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            marginBottom:   "18px",
          }}
        >
          <div className="section-kicker" style={{ margin: 0 }}>
            Voice Compass
          </div>
          {showResult && (
            <button
              onClick={reset}
              style={{
                background:  "transparent",
                border:      "1px solid var(--line)",
                color:       "var(--muted)",
                fontSize:    "0.78rem",
                padding:     "4px 10px",
                cursor:      "pointer",
                fontFamily:  "inherit",
              }}
              aria-label="Reset voice Compass"
            >
              Reset
            </button>
          )}
        </div>

        {/* ── Unsupported ─────────────────────────────────────────────────── */}
        {unsupported && (
          <div>
            <p
              style={{
                color:      "var(--muted)",
                fontSize:   "0.9rem",
                lineHeight: 1.55,
                margin:     "0 0 8px",
              }}
            >
              Voice input is not supported in this browser yet.
            </p>
            <p
              style={{
                color:    "var(--muted)",
                fontSize: "0.82rem",
                margin:   0,
              }}
            >
              Try Chrome or Edge for push-to-talk Compass.
            </p>
          </div>
        )}

        {/* ── Main button ─────────────────────────────────────────────────── */}
        {!unsupported && (
          <button
            onClick={isBusy || showResult ? undefined : startListening}
            disabled={isBusy}
            aria-live="polite"
            aria-label={
              isListening ? "Listening — speak now"
              : isThinking ? "Compass is thinking"
              : "Ask Compass a question"
            }
            style={{
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              width:           "100%",
              minHeight:       "52px",
              padding:         "0 24px",
              border:          isListening
                                 ? "1px solid var(--accent)"
                                 : "1px solid var(--line-strong)",
              background:      isListening
                                 ? "transparent"
                                 : showResult
                                 ? "var(--panel)"
                                 : "var(--accent)",
              color:           isListening
                                 ? "var(--accent)"
                                 : showResult
                                 ? "var(--muted)"
                                 : "var(--accent-text)",
              fontSize:        "0.95rem",
              fontWeight:      650,
              fontFamily:      "inherit",
              letterSpacing:   "-0.01em",
              cursor:          isBusy || showResult ? "default" : "pointer",
              transition:      "background 0.2s, border-color 0.2s, color 0.2s",
            }}
          >
            {/* Pulsing dot when listening */}
            {isListening && <PulsingDot />}

            {/* Waveform bars when listening */}
            {isListening && (
              <span
                aria-hidden="true"
                style={{
                  display:     "flex",
                  alignItems:  "center",
                  gap:         "3px",
                  marginRight: "10px",
                  height:      "18px",
                }}
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    style={{
                      display:         "block",
                      width:           "3px",
                      height:          "100%",
                      background:      "var(--accent)",
                      borderRadius:    "2px",
                      transformOrigin: "center bottom",
                      animation:       `compass-wave ${0.5 + i * 0.1}s ease-in-out infinite`,
                      animationDelay:  `${i * 0.08}s`,
                    }}
                  />
                ))}
              </span>
            )}

            {/* Button label */}
            {isListening ? "Listening…"
              : isThinking ? "Thinking…"
              : showResult  ? "Ask again"
              : "Ask Compass"}
          </button>
        )}

        {/* ── Error state ──────────────────────────────────────────────────── */}
        {showError && (
          <div
            style={{
              marginTop:  "16px",
              padding:    "12px 14px",
              border:     "1px solid var(--line)",
              background: "var(--surface)",
            }}
          >
            <p
              style={{
                color:    "var(--text)",
                fontSize: "0.9rem",
                margin:   "0 0 10px",
              }}
            >
              {errorMsg}
            </p>
            <button
              onClick={reset}
              className="btn-secondary"
              style={{ fontSize: "0.82rem", minHeight: "34px", padding: "0 12px" }}
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Result area ──────────────────────────────────────────────────── */}
        {showResult && response && (
          <div
            style={{
              marginTop: "18px",
            }}
          >
            {/* Transcript */}
            {transcript && (
              <div
                style={{
                  marginBottom: "14px",
                  paddingBottom: "14px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <p
                  style={{
                    color:       "var(--muted)",
                    fontSize:    "0.72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                    fontWeight:  680,
                    margin:      "0 0 6px",
                  }}
                >
                  You said
                </p>
                <p
                  style={{
                    color:      "var(--soft)",
                    fontSize:   "0.95rem",
                    lineHeight: 1.45,
                    margin:     0,
                    fontStyle:  "italic",
                  }}
                >
                  "{transcript}"
                </p>
              </div>
            )}

            {/* Response */}
            <div>
              <p
                style={{
                  color:       "var(--muted)",
                  fontSize:    "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.09em",
                  fontWeight:  680,
                  margin:      "0 0 8px",
                }}
              >
                Compass says
              </p>
              <p
                style={{
                  color:      "var(--text)",
                  fontSize:   "1rem",
                  lineHeight: 1.58,
                  margin:     0,
                  fontWeight: 500,
                }}
              >
                {response.display}
              </p>
            </div>

            {/* Ask again button */}
            <button
              onClick={reset}
              className="btn-secondary"
              style={{
                marginTop:  "18px",
                fontSize:   "0.88rem",
                minHeight:  "38px",
                padding:    "0 16px",
                width:      "100%",
              }}
            >
              Ask another question
            </button>
          </div>
        )}

        {/* ── Hint text when idle ───────────────────────────────────────────── */}
        {voiceState === "idle" && (
          <p
            style={{
              color:     "var(--muted)",
              fontSize:  "0.82rem",
              marginTop: "12px",
              lineHeight: 1.5,
              margin:    "12px 0 0",
            }}
          >
            Try: "What should I do next?" · "Who should I meet?" · "Where am I going now?"
          </p>
        )}

        {/* ── Privacy notice ────────────────────────────────────────────────── */}
        {!unsupported && (
          <p
            style={{
              color:       "var(--muted)",
              fontSize:    "0.72rem",
              marginTop:   voiceState === "idle" ? "10px" : "18px",
              lineHeight:  1.5,
              opacity:     0.7,
            }}
          >
            Voice is processed in your browser for this prototype. Audio is not stored.
          </p>
        )}
      </div>
    </>
  );
}
