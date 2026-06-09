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
// Alias used in UI logic (maps to VoiceState)
// ─────────────────────────────────────────────────────────────────────────────
// Demo fallback activities — used when Firestore has no matching activities
// demoFallback: true marks them as synthetic; real data takes priority
// ─────────────────────────────────────────────────────────────────────────────
interface ActivityItem {
  id:           string;
  title:        string;
  type:         string;
  time?:        string;
  location?:    string;
  tags:         string[];
  demoFallback: boolean;
  primaryAction:   { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}
const DEMO_ACTIVITIES: ActivityItem[] = [
  { id:"arcade",    title:"TechXchange Arcade",          type:"fun",            time:"9:00 AM – 4:00 PM", location:"Expo / Experience Zone", tags:["fun","community","networking"], demoFallback:true, primaryAction:{label:"View activity",href:"/explore"},  secondaryAction:{label:"Add reminder",href:"/enroll"} },
  { id:"community", title:"Community Day",               type:"special_program",                           location:"Main Hall",              tags:["community","learning"],         demoFallback:true, primaryAction:{label:"View program", href:"/communities"},secondaryAction:{label:"Explore",    href:"/experience"} },
  { id:"partner",   title:"Partner Day",                 type:"special_program",                           location:"Partner Pavilion",        tags:["partner","business","ecosystem"],demoFallback:true, primaryAction:{label:"View program", href:"/explore"},    secondaryAction:{label:"Explore",    href:"/experience"} },
  { id:"data",      title:"Data Technical Summit",       type:"special_program",                           tags:["data","technical","learning"],demoFallback:true, primaryAction:{label:"View summit",  href:"/sessions"}, secondaryAction:{label:"Explore",    href:"/sessions"} },
  { id:"student",   title:"Student Dev Day",             type:"special_program",                           tags:["student","career","learning"],demoFallback:true, primaryAction:{label:"View program", href:"/sessions"}, secondaryAction:{label:"Connect",    href:"/champions"} },
  { id:"expert",    title:"Meet the Expert",             type:"expert_access",                             tags:["expert","learning","networking"],demoFallback:true, primaryAction:{label:"Find experts", href:"/champions"},secondaryAction:{label:"View sessions",href:"/sessions"} },
  { id:"roundtable",title:"Peer Roundtable",             type:"networking",                                tags:["peer","discussion","community"],demoFallback:true, primaryAction:{label:"View schedule",href:"/sessions"}, secondaryAction:{label:"Explore",    href:"/communities"} },
  { id:"network",   title:"Networking & Entertainment",  type:"fun",            time:"Evening",            location:"Main Atrium",            tags:["fun","networking","community"], demoFallback:true, primaryAction:{label:"View event",   href:"/explore"},  secondaryAction:{label:"Add reminder",href:"/enroll"} },
];

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

// ─────────────────────────────────────────────────────────────────────────────
// Compass Beacon — inline SVG icon
// Three concentric rings + central star + radial glow.
// State-aware: idle shows pulsing rings, listening shows waveform bars (below),
// thinking shows spinning outer ring.
// ─────────────────────────────────────────────────────────────────────────────

function CompassBeacon({ state }: { state: "idle" | "thinking" | "result" }) {
  const isThinking = state === "thinking";
  const size = 38;
  const cx   = size / 2;   // 19
  const cy   = size / 2;   // 19

  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: "10px", position: "relative" }}
    >
      {/* Radial glow — sits behind SVG */}
      <span
        className="beacon-glow-radial"
        style={{
          position:     "absolute",
          width:        size + 12,
          height:       size + 12,
          borderRadius: "50%",
          background:   "radial-gradient(circle, rgba(69,137,255,0.45) 0%, rgba(69,137,255,0) 70%)",
          animation:    "beacon-glow 2.4s ease-in-out infinite",
          pointerEvents:"none",
          transition:   "opacity 0.3s",
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "relative", zIndex: 1 }}
      >
        {/* ── Ring 3 (outermost) */}
        <circle
          cx={cx} cy={cy} r={17}
          stroke="rgba(69,137,255,0.22)"
          strokeWidth="0.75"
        style={{
  transformOrigin: `${cx}px ${cy}px`,
  animation: isThinking
    ? "beacon-think 1.1s linear 0s infinite"
    : "beacon-ring-1 2s ease-in-out 0.15s infinite",
}}
        />

        {/* ── Ring 2 */}
        <circle
          cx={cx} cy={cy} r={13}
          stroke="rgba(69,137,255,0.38)"
          strokeWidth="0.9"
          style={{
  transformOrigin: `${cx}px ${cy}px`,
  animation: isThinking
    ? "beacon-think 1.6s linear 0s infinite reverse"
    : "beacon-ring-2 2.6s ease-in-out 0.3s infinite",
}}
        />

        {/* ── Ring 1 (innermost ring) */}
        <circle
          cx={cx} cy={cy} r={9}
          stroke="rgba(69,137,255,0.6)"
          strokeWidth="1"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: isThinking
              ? "beacon-think 1.1s linear infinite"
              : "beacon-ring-1 2s ease-in-out infinite",
          }}
        />

        {/* ── Central star (4-point compass rose) */}
        <g
          className="beacon-star-group"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: "beacon-star 2.8s ease-in-out infinite",
          }}
        >
          {/* North spike */}
          <path
            d={`M${cx} ${cy - 6.5} L${cx - 1.4} ${cy - 2} L${cx} ${cy - 3.2} L${cx + 1.4} ${cy - 2} Z`}
            fill="rgba(69,137,255,1)"
          />
          {/* South spike */}
          <path
            d={`M${cx} ${cy + 6.5} L${cx - 1.4} ${cy + 2} L${cx} ${cy + 3.2} L${cx + 1.4} ${cy + 2} Z`}
            fill="rgba(69,137,255,1)"
          />
          {/* East spike */}
          <path
            d={`M${cx + 6.5} ${cy} L${cx + 2} ${cy - 1.4} L${cx + 3.2} ${cy} L${cx + 2} ${cy + 1.4} Z`}
            fill="rgba(69,137,255,1)"
          />
          {/* West spike */}
          <path
            d={`M${cx - 6.5} ${cy} L${cx - 2} ${cy - 1.4} L${cx - 3.2} ${cy} L${cx - 2} ${cy + 1.4} Z`}
            fill="rgba(69,137,255,1)"
          />
          {/* Center dot */}
          <circle cx={cx} cy={cy} r={1.8} fill="rgba(255,255,255,0.95)" />
          {/* Inner glow dot */}
          <circle cx={cx} cy={cy} r={3.5} fill="rgba(69,137,255,0.2)" />

          {/* Diagonal short ticks (secondary compass points) */}
          <path
            d={`M${cx + 3.8} ${cy - 3.8} L${cx + 1.6} ${cy - 1.6}`}
            stroke="rgba(69,137,255,0.5)" strokeWidth="0.8" strokeLinecap="round"
          />
          <path
            d={`M${cx - 3.8} ${cy - 3.8} L${cx - 1.6} ${cy - 1.6}`}
            stroke="rgba(69,137,255,0.5)" strokeWidth="0.8" strokeLinecap="round"
          />
          <path
            d={`M${cx + 3.8} ${cy + 3.8} L${cx + 1.6} ${cy + 1.6}`}
            stroke="rgba(69,137,255,0.5)" strokeWidth="0.8" strokeLinecap="round"
          />
          <path
            d={`M${cx - 3.8} ${cy + 3.8} L${cx - 1.6} ${cy + 1.6}`}
            stroke="rgba(69,137,255,0.5)" strokeWidth="0.8" strokeLinecap="round"
          />
        </g>
      </svg>
    </span>
  );
}

// Keep PulsingDot for listening state (waveform is used instead, but kept for safety)


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
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────

  const isListening  = voiceState === "listening";
  const isThinking   = voiceState === "thinking";
  const isBusy       = isListening || isThinking;
  const showResult   = voiceState === "result";
  const showError    = voiceState === "error";
  const unsupported  = voiceState === "unsupported";

  // Button label — state machine
  const btnLabel = isListening ? "🔴  Listening…"
    : isThinking  ? "✨  Thinking…"
    : showResult  ? "↻  Ask Again"
    : showError   ? "↻  Try Again"
    : "🎙  Ask Compass";

  // Button click — unified handler
function handleButtonClick() {
  if (isThinking) return;

  if (isListening) {
    recognitionRef.current?.stop();
    setVoiceState("idle");
    return;
  }

  if (showResult || showError) {
    reset();
    setTimeout(startListening, 80);
    return;
  }

  startListening();
}


  // Derive intent label from response action / display for result header
  const intentLabel = response?.action
    ? response.action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : response
    ? "Recommendation"
    : "";

  // Pick fallback activities relevant to last spoken text
  function getFallbackActivities(): ActivityItem[] {
    const t = transcript.toLowerCase();
    if (t.includes("fun") || t.includes("entertain") || t.includes("social"))
      return DEMO_ACTIVITIES.filter(a => a.tags.includes("fun"));
    if (t.includes("community") || t.includes("meet") || t.includes("people"))
      return DEMO_ACTIVITIES.filter(a => a.tags.includes("community")).slice(0, 2);
    if (t.includes("certif") || t.includes("learn") || t.includes("session"))
      return DEMO_ACTIVITIES.filter(a => a.tags.includes("learning")).slice(0, 2);
    if (t.includes("partner"))
      return DEMO_ACTIVITIES.filter(a => a.tags.includes("partner"));
    return [];
  }

  const fallbackActivities = showResult ? getFallbackActivities() : [];

  // ── Result card component (inline) ────────────────────────────────────────
  function ResultCard({ title, type, reason, time, location, primary, secondary }: {
    title: string; type: string; reason: string;
    time?: string; location?: string;
    primary: { label: string; href: string };
    secondary?: { label: string; href: string };
  }) {
    return (
      <div style={{
        border: "1px solid var(--line)", background: "var(--panel)",
        padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ color: "var(--text)", fontWeight: 600, fontSize: "0.95rem", letterSpacing: "-0.01em" }}>{title}</span>
          <span style={{ fontSize: "0.68rem", padding: "2px 8px", border: "1px solid var(--line)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{type}</span>
        </div>
        <p style={{ color: "var(--accent)", fontSize: "0.8rem", margin: 0, fontStyle: "italic" }}>{reason}</p>
        {(time || location) && (
          <p style={{ color: "var(--muted)", fontSize: "0.78rem", margin: 0 }}>
            {[time, location].filter(Boolean).join(" · ")}
          </p>
        )}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
          <a href={primary.href} style={{
            display: "inline-flex", alignItems: "center", height: "30px", padding: "0 12px",
            background: "var(--accent)", color: "var(--accent-text)",
            fontSize: "0.78rem", fontWeight: 650, textDecoration: "none", whiteSpace: "nowrap",
          }}>{primary.label}</a>
          {secondary && (
            <a href={secondary.href} style={{
              display: "inline-flex", alignItems: "center", height: "30px", padding: "0 12px",
              border: "1px solid var(--line)", color: "var(--muted)",
              fontSize: "0.78rem", textDecoration: "none", whiteSpace: "nowrap",
            }}>{secondary.label}</a>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes compass-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes compass-wave {
          0%, 100% { transform: scaleY(0.4); }
          50%       { transform: scaleY(1); }
        }
        @keyframes beacon-ring-1 {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%       { opacity: 0.25; transform: scale(1.06); }
        }
        @keyframes beacon-ring-2 {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%       { opacity: 0.12; transform: scale(1.09); }
        }
        @keyframes beacon-ring-3 {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50%       { opacity: 0.05; transform: scale(1.12); }
        }
        @keyframes beacon-star {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
          50%       { opacity: 0.85; transform: scale(0.96) rotate(15deg); }
        }
        @keyframes beacon-glow {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.65; }
        }
        @keyframes beacon-think {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .compass-beacon-btn:hover .beacon-glow-radial { opacity: 0.7 !important; }
        .compass-beacon-btn:hover .beacon-star-group  { filter: drop-shadow(0 0 3px rgba(69,137,255,0.9)); }
        .vcb-container { padding: 20px 24px 22px; background: transparent; }
        .vcb-btn {
          display: inline-flex; align-items: center; gap: 8px;
          height: 42px; padding: 0 18px;
          border: 1px solid var(--line-strong);
          font-size: 0.9rem; font-weight: 650; font-family: inherit;
          letter-spacing: -0.01em; cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .vcb-btn-idle    { background: var(--accent);  border-color: var(--accent);  color: var(--accent-text); }
        .vcb-btn-listen  { background: transparent;    border-color: var(--accent);  color: var(--accent); }
        .vcb-btn-process { background: var(--panel);   border-color: var(--line);    color: var(--muted);  cursor: default; }
        .vcb-btn-results { background: var(--panel);   border-color: var(--accent);  color: var(--accent); }
        .vcb-btn-error   { background: var(--panel);   border-color: #DC2626;        color: #DC2626; }
        @media (max-width: 640px) {
          .vcb-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="vcb-container">

        {/* ── Header row ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>
            Compass Assistant
          </p>
        </div>

        {/* ── Unsupported ─────────────────────────────────────────────────── */}
        {unsupported && (
          <div>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.55, margin: "0 0 6px" }}>
              Voice input is not supported in this browser.
            </p>
            <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>Try Chrome or Edge.</p>
          </div>
        )}

        {/* ── Push-to-talk button ─────────────────────────────────────────── */}
        {!unsupported && (
          <button
            onClick={handleButtonClick}
            disabled={isThinking}
            aria-live="polite"
            aria-label={btnLabel}
            className={[
              "vcb-btn compass-beacon-btn",
              isListening          ? "vcb-btn-listen"
              : isThinking         ? "vcb-btn-process"
              : showResult         ? "vcb-btn-results"
              : showError          ? "vcb-btn-error"
              :                      "vcb-btn-idle",
            ].join(" ")}
          >
            {/* Waveform during listening */}
            {isListening && (
              <span aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: "2px", height: "16px" }}>
                {[0,1,2,3,4].map(i => (
                  <span key={i} style={{
                    display: "block", width: "2.5px", height: "100%",
                    background: "var(--accent)", borderRadius: "2px",
                    transformOrigin: "center bottom",
                    animation: `compass-wave ${0.5 + i * 0.1}s ease-in-out infinite`,
                    animationDelay: `${i * 0.08}s`,
                  }} />
                ))}
              </span>
            )}
            {/* Beacon icon when not listening */}
            {!isListening && (
              <CompassBeacon state={isThinking ? "thinking" : showResult ? "result" : "idle"} />
            )}
            {btnLabel}
          </button>
        )}

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {showError && (
          <div style={{ marginTop: "14px", padding: "10px 14px", background: "#FEF2F2", border: "1px solid #DC2626" }}>
            <p style={{ color: "#DC2626", fontSize: "0.88rem", margin: 0 }}>{errorMsg}</p>
          </div>
        )}

        {/* ── Idle prompt list ────────────────────────────────────────────── */}
        {voiceState === "idle" && !unsupported && (
          <div style={{ marginTop: "14px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.78rem", margin: "0 0 8px" }}>Try asking:</p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" }}>
              {[
                "What should I do next?",
                "Find AI sessions for me",
                "Who should I meet today?",
                "Show me certification opportunities",
                "Build my afternoon schedule",
              ].map(q => (
                <li key={q} style={{ color: "var(--soft)", fontSize: "0.84rem", lineHeight: 1.4 }}>
                  <span style={{ color: "var(--accent)", marginRight: "6px", fontSize: "0.65rem" }}>◆</span>{q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Results ─────────────────────────────────────────────────────── */}
        {showResult && response && (
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* 1 · You asked */}
            {transcript && (
              <div style={{ paddingBottom: "12px", borderBottom: "1px solid var(--line)" }}>
                <p style={{ color: "var(--muted)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 4px" }}>
                  You asked
                </p>
                <p style={{ color: "var(--soft)", fontSize: "0.92rem", margin: 0, fontStyle: "italic", lineHeight: 1.4 }}>
                  "{transcript}"
                </p>
              </div>
            )}

            {/* 2 · Compass understood */}
            {intentLabel && (
              <div>
                <p style={{ color: "var(--muted)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 4px" }}>
                  Compass understood
                </p>
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  height: "22px", padding: "0 10px",
                  border: "1px solid var(--accent)", color: "var(--accent)",
                  fontSize: "0.72rem", fontWeight: 680, letterSpacing: "0.08em", textTransform: "uppercase",
                }}>{intentLabel}</span>
              </div>
            )}

            {/* 3 · Recommended next moves */}
            <div>
              <p style={{ color: "var(--muted)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 10px" }}>
                Recommended next moves
              </p>
              {/* Primary response text */}
              <p style={{ color: "var(--text)", fontSize: "0.95rem", lineHeight: 1.55, margin: "0 0 12px", fontWeight: 500 }}>
                {response.display}
              </p>

              {/* Fallback activity cards if relevant */}
              {fallbackActivities.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {fallbackActivities.map(act => (
                    <ResultCard
                      key={act.id}
                      title={act.title}
                      type={act.type.replace(/_/g, " ")}
                      reason="Compass matched this to your question"
                      time={act.time}
                      location={act.location}
                      primary={act.primaryAction}
                      secondary={act.secondaryAction}
                    />
                  ))}
                </div>
              )}

              {/* Action links from response */}
              {response.action === "show_champions" && (
                <ResultCard title="Browse Champions" type="community" reason="Find people to meet at TechXchange"
                  primary={{ label: "View champions", href: "/champions" }}
                  secondary={{ label: "My experience",  href: "/experience" }} />
              )}
              {response.action === "navigate_experience" && (
                <ResultCard title="My Compass Experience" type="personalized" reason="Your full day plan and recommendations"
                  primary={{ label: "Open My Experience", href: "/experience" }} />
              )}
            </div>
          </div>
        )}

        {/* ── Privacy notice ──────────────────────────────────────────────── */}
        {!unsupported && (
          <p style={{ color: "var(--muted)", fontSize: "0.68rem", marginTop: "16px", lineHeight: 1.5, opacity: 0.6 }}>
            Voice is processed in your browser. Audio is not stored.
          </p>
        )}
      </div>
    </>
  );
}
