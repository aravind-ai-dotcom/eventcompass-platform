"use client";

// =============================================================================
// EventCompass — Voice Compass Button (compact)
// src/components/voice/VoiceCompassButton.tsx
//
// Push-to-talk concierge panel — compact inline assistant style.
//
// Behaviour:
//   Idle       → kicker + "Ask Compass" button + brief hint chips
//   Listening  → waveform bars in button
//   Thinking   → spinning beacon in button (classifying intent)
//   Generating → spinning beacon in button (fetching cloud TTS)
//   Result     → transcript quote + compact action cards
//   Error      → error text beneath button
//
// Architecture:
//   - Browser SpeechRecognition (webkit fallback) for speech-to-text
//   - /api/voice (Google TTS) for spoken response; browser SpeechSynthesis fallback
//   - voiceIntentClassifier.ts for deterministic intent matching
//   - No Firestore writes — action callbacks fired to parent if provided
//   - No audio stored, uploaded, or transmitted
//
// Props (all existing props unchanged; new optional action callbacks added):
//   nextBestMove / topSession / topChampion / participantGoals / participantTracks
//   onDismiss / onMarkAttended / onNavigateExperience
//   onAddToSchedule?       — fired when user taps "+ Schedule" on a session card
//   onDoNotSuggestSession? — fired when user taps "Do not suggest" on a session card
//   onSavePerson?          — fired when user taps "Save person" on a champion card
//   onDoNotSuggestPerson?  — fired when user taps "Do not suggest" on a champion card
// =============================================================================

import { useState, useCallback, useRef, useEffect } from "react";
import type { NextBestMove, ScoredSession, ScoredChampion } from "@/types";
import {
  classifyVoiceIntent,
  buildVoiceResponse,
  pickSessionRecommendation,
  type VoiceResponse,
} from "@/services/voiceIntentClassifier";
import { normalizeVoiceInput } from "@/services/voice/sttNormalizer";
import { ensureGovernanceLoaded } from "@/services/governance/governanceLoader";
import { applyTtsPronunciation } from "@/services/voice/voicePronunciation";
import type { VoiceExperience } from "@/services/voice/voiceDictionaryTypes";
import { localeFromSpeechLang, type UiLocale } from "@/services/i18n/voiceLocale";
import { formatSessionIntelligenceSummary } from "@/lib/sessionIntelligence";
import { classifySessionFormat } from "@/lib/recommendationBalancing";
import { primaryMatchReason } from "@/lib/personCardHelpers";
import { SAMPLE_LIVE_HUDDLES, rankLiveHuddles } from "@/lib/sampleLiveHuddles";
import { compassLiveSignalText } from "@/lib/compassLiveSignal";
import type { CertificationJourneyPlan } from "@/lib/certificationJourneyIntelligence";
import type { ScoredSpeaker, SpeakerProfile } from "@/types/speaker";
import type { SpeakerParticipantContext } from "@/lib/speakerIntelligence";
import {
  VOICE_TONE_OPTIONS,
  VOICE_TONE_STORAGE_KEY,
  getVoiceNameForTone,
  resolveStoredTone,
  type VoiceToneId,
} from "@/lib/voiceTtsOptions";

/** Tiny silent WAV — unlocks audio playback during the user gesture. */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type VoiceState = "idle" | "listening" | "thinking" | "generating" | "result" | "error" | "unsupported";

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
  { id:"arcade",    title:"TechXchange Arcade",         type:"fun",            time:"9:00 AM – 4:00 PM", location:"Expo / Experience Zone", tags:["fun","community","networking"], demoFallback:true, primaryAction:{label:"View activity",href:"/txc/explore"},   secondaryAction:{label:"Add reminder",href:"/txc/enroll"} },
  { id:"community", title:"Community Day",              type:"special_program",                           location:"Main Hall",              tags:["community","learning"],         demoFallback:true, primaryAction:{label:"View program", href:"/txc/communities"},secondaryAction:{label:"Explore",href:"/txc/experience"} },
  { id:"partner",   title:"Partner Day",                type:"special_program",                           location:"Partner Pavilion",        tags:["partner","business","ecosystem"],demoFallback:true, primaryAction:{label:"View program", href:"/txc/explore"},   secondaryAction:{label:"Explore",href:"/txc/experience"} },
  { id:"data",      title:"Data Technical Summit",      type:"special_program",                           tags:["data","technical","learning"],demoFallback:true, primaryAction:{label:"View summit",  href:"/txc/sessions"}, secondaryAction:{label:"Explore",href:"/txc/sessions"} },
  { id:"student",   title:"Student Dev Day",            type:"special_program",                           tags:["student","career","learning"],demoFallback:true, primaryAction:{label:"View program", href:"/txc/sessions"}, secondaryAction:{label:"Connect",href:"/txc/champions"} },
  { id:"expert",    title:"Meet the Expert",            type:"expert_access",                             tags:["expert","learning","networking"],demoFallback:true, primaryAction:{label:"Find experts",href:"/txc/champions"}, secondaryAction:{label:"View sessions",href:"/txc/sessions"} },
  { id:"roundtable",title:"Peer Roundtable",            type:"networking",                                tags:["peer","discussion","community"],demoFallback:true, primaryAction:{label:"View schedule",href:"/txc/sessions"}, secondaryAction:{label:"Explore",href:"/txc/communities"} },
  { id:"network",   title:"Networking & Entertainment", type:"fun",            time:"Evening",            location:"Main Atrium",            tags:["fun","networking","community"], demoFallback:true, primaryAction:{label:"View event",   href:"/txc/explore"},   secondaryAction:{label:"Add reminder",href:"/txc/enroll"} },
];

interface VoiceCompassButtonProps {
  variant?: "inline" | "companion";
  nextBestMove?:           NextBestMove | null;
  balancedMoves?:          NextBestMove[];
  topSession?:             ScoredSession | null;
  topChampion?:            ScoredChampion | null;
  rankedSessions?:         ScoredSession[];
  participantGoals?:       string[];
  participantTracks?:      string[];
  certLabel?:              string | null;
  certificationJourney?:   CertificationJourneyPlan | null;
  isEnrolled?:             boolean;
  voiceExperience?:        VoiceExperience;
  voiceLocale?:            UiLocale;
  onDismiss?:              () => void;
  onMarkAttended?:         () => void;
  onNavigateExperience?:   () => void;
  // New optional action callbacks — component works without them
  onAddToSchedule?:        (sessionId: string) => void;
  onDoNotSuggestSession?:  (sessionId: string) => void;
  onSavePerson?:           (championId: string) => void;
  onDoNotSuggestPerson?:   (championId: string) => void;
  topSpeaker?:             ScoredSpeaker | null;
  rankedSpeakers?:         ScoredSpeaker[];
  speakerCatalog?:         SpeakerProfile[];
  speakerCtx?:             SpeakerParticipantContext;
}


// ─────────────────────────────────────────────────────────────────────────────
// Browser SpeechRecognition type shim
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
// Compass Beacon — inline SVG icon (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function CompassBeacon({ state, size = 28 }: { state: "idle" | "thinking" | "result"; size?: number }) {
  const isThinking = state === "thinking";
  const cx   = size / 2;
  const cy   = size / 2;

  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}
    >
      <span
        className="beacon-glow-radial"
        style={{
          position: "absolute", width: size + 10, height: size + 10, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(69,137,255,0.4) 0%, rgba(69,137,255,0) 70%)",
          animation: "beacon-glow 2.4s ease-in-out infinite", pointerEvents: "none",
        }}
      />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none"
        xmlns="http://www.w3.org/2000/svg" style={{ position: "relative", zIndex: 1 }}>
        <circle cx={cx} cy={cy} r={12.5} stroke="rgba(69,137,255,0.22)" strokeWidth="0.7"
          style={{ transformOrigin: `${cx}px ${cy}px`,
            animation: isThinking ? "beacon-think 1.1s linear infinite" : "beacon-ring-1 2s ease-in-out 0.15s infinite" }} />
        <circle cx={cx} cy={cy} r={9.5} stroke="rgba(69,137,255,0.38)" strokeWidth="0.85"
          style={{ transformOrigin: `${cx}px ${cy}px`,
            animation: isThinking ? "beacon-think 1.6s linear infinite reverse" : "beacon-ring-2 2.6s ease-in-out 0.3s infinite" }} />
        <circle cx={cx} cy={cy} r={6.5} stroke="rgba(69,137,255,0.6)" strokeWidth="0.95"
          style={{ transformOrigin: `${cx}px ${cy}px`,
            animation: isThinking ? "beacon-think 1.1s linear infinite" : "beacon-ring-1 2s ease-in-out infinite" }} />
        <g className="beacon-star-group"
          style={{ transformOrigin: `${cx}px ${cy}px`, animation: "beacon-star 2.8s ease-in-out infinite" }}>
          <path d={`M${cx} ${cy-4.8}L${cx-.95} ${cy-1.4}L${cx} ${cy-2.4}L${cx+.95} ${cy-1.4}Z`} fill="rgba(69,137,255,1)" />
          <path d={`M${cx} ${cy+4.8}L${cx-.95} ${cy+1.4}L${cx} ${cy+2.4}L${cx+.95} ${cy+1.4}Z`} fill="rgba(69,137,255,1)" />
          <path d={`M${cx+4.8} ${cy}L${cx+1.4} ${cy-.95}L${cx+2.4} ${cy}L${cx+1.4} ${cy+.95}Z`} fill="rgba(69,137,255,1)" />
          <path d={`M${cx-4.8} ${cy}L${cx-1.4} ${cy-.95}L${cx-2.4} ${cy}L${cx-1.4} ${cy+.95}Z`} fill="rgba(69,137,255,1)" />
          <circle cx={cx} cy={cy} r={1.4} fill="rgba(255,255,255,0.95)" />
          <circle cx={cx} cy={cy} r={2.6} fill="rgba(69,137,255,0.2)" />
          <path d={`M${cx+2.8} ${cy-2.8}L${cx+1.2} ${cy-1.2}`} stroke="rgba(69,137,255,0.5)" strokeWidth="0.7" strokeLinecap="round" />
          <path d={`M${cx-2.8} ${cy-2.8}L${cx-1.2} ${cy-1.2}`} stroke="rgba(69,137,255,0.5)" strokeWidth="0.7" strokeLinecap="round" />
          <path d={`M${cx+2.8} ${cy+2.8}L${cx+1.2} ${cy+1.2}`} stroke="rgba(69,137,255,0.5)" strokeWidth="0.7" strokeLinecap="round" />
          <path d={`M${cx-2.8} ${cy+2.8}L${cx-1.2} ${cy+1.2}`} stroke="rgba(69,137,255,0.5)" strokeWidth="0.7" strokeLinecap="round" />
        </g>
      </svg>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CompactCard — recommendation card with inline action chips (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

const chipBase: React.CSSProperties = {
  display: "inline-flex", alignItems: "center",
  height: "24px", padding: "0 9px",
  border: "1px solid var(--line)", background: "transparent",
  color: "var(--muted)", fontSize: "0.73rem",
  cursor: "pointer", fontFamily: "inherit",
  textDecoration: "none", whiteSpace: "nowrap",
  transition: "background 0.12s, color 0.12s, border-color 0.12s",
  lineHeight: 1,
};

interface CompactCardProps {
  title:       string;
  type:        string;
  meta?:       string;
  why?:        string;
  infoHref:    string;
  sessionId?:  string;
  championId?: string;
  onAddToSchedule?:        (id: string) => void;
  onDoNotSuggestSession?:  (id: string) => void;
  onSavePerson?:           (id: string) => void;
  onDoNotSuggestPerson?:   (id: string) => void;
}

function CompactCard({
  title, type, meta, why, infoHref,
  sessionId, championId,
  onAddToSchedule, onDoNotSuggestSession,
  onSavePerson, onDoNotSuggestPerson,
}: CompactCardProps) {
  const [scheduled,   setScheduled]   = useState(false);
  const [savedPerson, setSavedPerson] = useState(false);
  const [dismissed,   setDismissed]   = useState(false);

  if (dismissed) return null;

  const accentChip: React.CSSProperties = {
    ...chipBase,
    background: "rgba(15,98,254,0.08)",
    color: "var(--accent)",
    borderColor: "var(--accent)",
    cursor: "default",
  };

  return (
    <div style={{ border: "1px solid var(--line)", padding: "9px 12px", display: "flex", flexDirection: "column", gap: "5px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text)", lineHeight: 1.3 }}>{title}</span>
        <span style={{ fontSize: "0.65rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap", flexShrink: 0, paddingTop: "2px" }}>{type}</span>
      </div>
      {meta && (
        <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0, lineHeight: 1.4 }}>{meta}</p>
      )}
      {why && (
        <p className="voice-compact-why">{why}</p>
      )}
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", paddingTop: "2px" }}>
        <a href={infoHref} style={{ ...chipBase, color: "var(--accent)", borderColor: "rgba(15,98,254,0.35)" }}>
          Info ↗
        </a>
        {sessionId && !scheduled && (
          <button onClick={() => { setScheduled(true); onAddToSchedule?.(sessionId); }} style={chipBase}>
            Add to schedule
          </button>
        )}
        {sessionId && scheduled && <span style={accentChip}>✓ Scheduled</span>}
        {championId && !savedPerson && (
          <button onClick={() => { setSavedPerson(true); onSavePerson?.(championId); }} style={chipBase}>
            Save person
          </button>
        )}
        {championId && savedPerson && <span style={accentChip}>✓ Saved</span>}
        {(sessionId || championId) && (
          <button
            onClick={() => {
              setDismissed(true);
              if (sessionId)  onDoNotSuggestSession?.(sessionId);
              if (championId) onDoNotSuggestPerson?.(championId);
            }}
            style={{ ...chipBase, opacity: 0.55 }}
          >
            Do not suggest
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Voice tone picker — Guide / Studio Google TTS A/B
// ─────────────────────────────────────────────────────────────────────────────

function VoiceTonePicker({
  tone,
  onChange,
}: {
  tone: VoiceToneId;
  onChange: (tone: VoiceToneId) => void;
}) {
  return (
    <div className="voice-tone-picker">
      <span className="voice-tone-picker-label">Choose your Compass voice.</span>
      <div className="voice-tone-picker-row" role="group" aria-label="Voice tone">
        <span className="voice-tone-picker-kicker">Voice</span>
        {VOICE_TONE_OPTIONS.map(option => (
          <button
            key={option.id}
            type="button"
            className={`voice-tone-chip${tone === option.id ? " is-active" : ""}`}
            aria-pressed={tone === option.id}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function VoiceCompassButton({
  variant = "inline",
  nextBestMove,
  balancedMoves,
  topSession,
  topChampion,
  rankedSessions,
  participantGoals,
  participantTracks,
  certLabel,
  certificationJourney,
  isEnrolled,
  voiceExperience = "techxchange",
  voiceLocale,
  onDismiss,
  onMarkAttended,
  onNavigateExperience,
  onAddToSchedule,
  onDoNotSuggestSession,
  onSavePerson,
  onDoNotSuggestPerson,
  topSpeaker,
  rankedSpeakers,
  speakerCatalog,
  speakerCtx,
}: VoiceCompassButtonProps) {

  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response,   setResponse]   = useState<VoiceResponse | null>(null);
  const [errorMsg,   setErrorMsg]   = useState("");

  const [pendingAudioUrl, setPendingAudioUrl] = useState<string | null>(null);
  const [voiceTone, setVoiceTone] = useState<VoiceToneId>("guide");
  const [activeSession, setActiveSession] = useState<ScoredSession | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef       = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef       = useRef<HTMLAudioElement | null>(null);
  const recentRecsRef  = useRef<string[]>([]);
  const recentFormatsRef = useRef<import("@/lib/recommendationBalancing").SessionFormat[]>([]);
  const speechLangRef  = useRef("en-US");

  // Preload Firestore governance cache for voice matching
  useEffect(() => {
    void ensureGovernanceLoaded(voiceExperience);
  }, [voiceExperience]);

  // Check support on mount
  useEffect(() => {
    if (!getSpeechRecognition()) setVoiceState("unsupported");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setVoiceTone(resolveStoredTone(localStorage.getItem(VOICE_TONE_STORAGE_KEY)));
  }, []);

  const handleVoiceToneChange = useCallback((tone: VoiceToneId) => {
    setVoiceTone(tone);
    if (typeof window !== "undefined") {
      localStorage.setItem(VOICE_TONE_STORAGE_KEY, tone);
    }
  }, []);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  /** Prime audio during the user gesture so async TTS playback is allowed. */
  const primeAudioUnlock = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    const unlockedAudio = new Audio();
    unlockedAudio.preload = "auto";
    audioRef.current = unlockedAudio;

    unlockedAudio.muted = true;
    unlockedAudio.src = SILENT_WAV;
    void unlockedAudio.play().then(() => {
      unlockedAudio.pause();
      unlockedAudio.currentTime = 0;
      unlockedAudio.muted = false;
      unlockedAudio.removeAttribute("src");
      unlockedAudio.load();
    }).catch(() => {
      unlockedAudio.muted = false;
      unlockedAudio.removeAttribute("src");
      unlockedAudio.load();
    });

    return unlockedAudio;
  }, []);

  const fallbackToSpeechSynthesis = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    console.log("[VoiceCompass] Falling back to speechSynthesis");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  // ── Cloud TTS → browser synthesis fallback only when fetch fails ─────────
  const speakCloudVoice = useCallback(async (
    text: string,
    unlockedAudio?: HTMLAudioElement | null,
    voiceName?: string,
  ): Promise<void> => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setPendingAudioUrl(null);

    const audio = unlockedAudio ?? audioRef.current;
    if (!audio) {
      console.warn("[VoiceCompass] No unlocked audio element; playback may be blocked.");
    }

    console.log("[VoiceCompass] Google TTS request started", { voiceName });

    let cloudAudioReady = false;
    let blobUrl: string | null = null;

    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceName }),
      });

      if (!res.ok) {
        throw new Error(`/api/voice returned ${res.status}: ${await res.text()}`);
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("audio")) {
        throw new Error(`Unexpected TTS content type: ${contentType || "unknown"}`);
      }

      console.log("[VoiceCompass] Google TTS response received");

      const blob = await res.blob();
      if (!blob.size) {
        throw new Error("Google TTS returned an empty audio blob");
      }

      blobUrl = URL.createObjectURL(blob);
      console.log("[VoiceCompass] Audio URL created", { bytes: blob.size, type: blob.type });

      const targetAudio = audio ?? (() => {
        const fallback = new Audio();
        fallback.preload = "auto";
        audioRef.current = fallback;
        return fallback;
      })();

      targetAudio.src = blobUrl;
      targetAudio.load();
      audioRef.current = targetAudio;
      cloudAudioReady = true;

      targetAudio.onended = () => {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        if (audioRef.current === targetAudio) {
          audioRef.current = null;
        }
        setPendingAudioUrl(null);
      };

      console.log("[VoiceCompass] Attempting playback");
      try {
        await targetAudio.play();
        console.log("[VoiceCompass] Cloud playback started");
      } catch (playErr) {
        if (playErr instanceof DOMException && playErr.name === "NotAllowedError") {
          console.warn("[VoiceCompass] Playback blocked — showing Play Compass voice");
          setPendingAudioUrl(blobUrl);
          return;
        }
        console.warn("[VoiceCompass] Playback failed but cloud audio is ready", playErr);
        setPendingAudioUrl(blobUrl);
      }
      return;
    } catch (err) {
      if (cloudAudioReady && blobUrl) {
        console.warn("[VoiceCompass] Cloud audio generated but setup failed — manual play available", err);
        setPendingAudioUrl(blobUrl);
        return;
      }
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      console.error("[VoiceCompass] Cloud voice failed:", err);
      fallbackToSpeechSynthesis(text);
    }
  }, [fallbackToSpeechSynthesis, voiceTone]);

  // ── Handle resolved transcript ──────────────────────────────────────────────
  const handleTranscript = useCallback(async (text: string) => {
    setVoiceState("thinking");
    setTranscript(text);

    await new Promise<void>(resolve => setTimeout(resolve, 300));

    await ensureGovernanceLoaded(voiceExperience);
    const locale = voiceLocale ?? localeFromSpeechLang(speechLangRef.current);
    const normalized = normalizeVoiceInput(text, voiceExperience);
    const classified = classifyVoiceIntent(normalized, voiceExperience);
    const pool = rankedSessions?.length
      ? rankedSessions
      : topSession ? [topSession] : [];
    const picked = pickSessionRecommendation(
      pool,
      recentRecsRef.current,
      recentFormatsRef.current,
    );
    if (picked) {
      recentRecsRef.current = [...recentRecsRef.current, picked.id].slice(-5);
      recentFormatsRef.current = [
        ...recentFormatsRef.current,
        classifySessionFormat(picked),
      ].slice(-5);
      setActiveSession(picked);
    }
    const rankedHuddles = rankLiveHuddles(
      SAMPLE_LIVE_HUDDLES,
      participantTracks ?? [],
      participantGoals ?? [],
    );
    const voiceResp  = buildVoiceResponse(classified, {
      nextBestMove:      nextBestMove      ?? null,
      balancedMoves:     balancedMoves     ?? [],
      topSession:        topSession        ?? null,
      activeSession:     picked            ?? topSession ?? null,
      rankedSessions:    rankedSessions    ?? [],
      topChampion:       topChampion       ?? null,
      participantGoals:  participantGoals  ?? [],
      participantTracks: participantTracks ?? [],
      liveHuddles:       rankedHuddles,
      isEnrolled:        isEnrolled ?? true,
      certLabel:         certLabel ?? null,
      certificationJourney: certificationJourney ?? null,
      topSpeaker:          topSpeaker          ?? null,
      rankedSpeakers:      rankedSpeakers      ?? [],
      speakerCatalog:      speakerCatalog      ?? [],
      speakerCtx:          speakerCtx          ?? {},
      experience:        voiceExperience,
      locale,
    });

    setResponse(voiceResp);
    setVoiceState("generating");

    const ttsText = applyTtsPronunciation(voiceResp.spoken, voiceExperience);
    await speakCloudVoice(ttsText, audioRef.current, getVoiceNameForTone(voiceTone));

    setVoiceState("result");

    if (voiceResp.action === "navigate_experience" && onNavigateExperience) onNavigateExperience();
    if (voiceResp.action === "dismiss"             && onDismiss)             onDismiss();
    if (voiceResp.action === "mark_attended"       && onMarkAttended)        onMarkAttended();
    if (voiceResp.action === "show_day"            && onNavigateExperience)  onNavigateExperience();
  }, [
    nextBestMove, balancedMoves, topSession, topChampion, rankedSessions,
    participantGoals, participantTracks,
    speakCloudVoice, onDismiss, onMarkAttended, onNavigateExperience, isEnrolled,
    voiceExperience, voiceLocale, certLabel, certificationJourney,
  ]);

  // ── Start listening ─────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) { setVoiceState("unsupported"); return; }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current?.src) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    setVoiceState("listening");
    setTranscript("");
    setResponse(null);
    setErrorMsg("");

    const recognition           = new SpeechRecognition();
    recognition.lang            = voiceLocale === "zh-CN" ? "zh-CN" : "en-US";
    speechLangRef.current       = recognition.lang;
    recognition.interimResults  = false;
    recognition.maxAlternatives = 1;
    recognition.continuous      = false;
    recognitionRef.current      = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0];
      if (result?.[0]) {
        const t = result[0].transcript.trim();
        if (t) handleTranscript(t);
      }
    };

    recognition.onerror = (event: { error: string }) => {
      const msg = ((): string => {
        switch (event.error) {
          case "no-speech":     return "No speech detected. Please try again.";
          case "audio-capture": return "Microphone not available. Check browser permissions.";
          case "not-allowed":   return "Microphone access denied. Enable it in your browser settings.";
          case "network":       return "Network error. Speech recognition requires a connection.";
          case "aborted":       return "";
          default:              return `Speech error: ${event.error}`;
        }
      })();
      if (msg) { setErrorMsg(msg); setVoiceState("error"); }
      else     { setVoiceState("idle"); }
    };

    recognition.onend = () => {
      setVoiceState(prev => prev === "listening" ? "idle" : prev);
    };

    recognition.start();
  }, [handleTranscript, voiceLocale]);

  // ── Reset to idle ───────────────────────────────────────────────────────────
  
  const reset = useCallback(() => {

  recognitionRef.current?.abort();

  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.src = "";
    audioRef.current = null;
  }
  setVoiceState("idle");
  setTranscript("");
  setResponse(null);
  setErrorMsg("");
  setPendingAudioUrl(prev => {
    if (prev) URL.revokeObjectURL(prev);
    return null;
  });
}, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived state
  // ─────────────────────────────────────────────────────────────────────────

  const isListening   = voiceState === "listening";
  const isThinking    = voiceState === "thinking";
  const isGenerating  = voiceState === "generating";
  const showResult    = voiceState === "result";
  const showError     = voiceState === "error";
  const unsupported   = voiceState === "unsupported";
  const isProcessing  = isThinking || isGenerating;

  const btnLabel = isListening   ? "Listening…"
    : isThinking    ? "Thinking…"
    : isGenerating  ? "Generating…"
    : showResult    ? "↻  Ask Again"
    : showError     ? "↻  Try Again"
    : "Ask Compass";

  function handleButtonClick() {
    if (isProcessing) return;
    if (isListening) { recognitionRef.current?.stop(); setVoiceState("idle"); return; }
    if (showResult || showError) {
      reset();
      primeAudioUnlock();
      setTimeout(startListening, 80);
      return;
    }
    primeAudioUnlock();
    startListening();
  }

  const playPendingVoice = useCallback(async () => {
    const url = pendingAudioUrl;
    if (!url) return;
    const audio = audioRef.current ?? new Audio();
    audio.preload = "auto";
    audio.src = url;
    audio.load();
    audioRef.current = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (audioRef.current === audio) audioRef.current = null;
      setPendingAudioUrl(null);
    };
    console.log("[VoiceCompass] Attempting playback");
    try {
      await audio.play();
      console.log("[VoiceCompass] Cloud playback started");
      setPendingAudioUrl(null);
    } catch (err) {
      console.warn("[VoiceCompass] Manual playback failed", err);
    }
  }, [pendingAudioUrl]);

  // Fallback activities matched to last transcript
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

  const displaySession = activeSession ?? topSession ?? null;

  const showSessionCard  = !!displaySession && showResult &&
    !["show_champions", "dismiss"].includes(response?.action ?? "");
  const showChampionCard = !!topChampion && showResult &&
    response?.action === "show_champions";
  const hasCard = showSessionCard || showChampionCard || fallbackActivities.length > 0;

  const sessionMeta = displaySession ? [
    (displaySession as unknown as Record<string, unknown>).day        as string | undefined,
    (displaySession as unknown as Record<string, unknown>).time_start as string | undefined,
    (displaySession as unknown as Record<string, unknown>).room       as string | undefined,
  ].filter(Boolean).join(" · ") : "";

  const champMeta = topChampion ? [
    (topChampion as unknown as Record<string, unknown>).title        as string | undefined,
    (topChampion as unknown as Record<string, unknown>).organization as string | undefined,
    (topChampion as unknown as Record<string, unknown>).company      as string | undefined,
  ].filter(Boolean).slice(0, 2).join(" · ") : "";

  const profileSignals = [...(participantTracks ?? []), ...(participantGoals ?? [])];
  const sessionWhy = displaySession
    ? formatSessionIntelligenceSummary(displaySession as ScoredSession, certLabel ?? null, 2)
    : undefined;
  const champWhy = topChampion
    ? primaryMatchReason(topChampion as ScoredChampion, profileSignals) ?? undefined
    : undefined;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes beacon-ring-1  { 0%,100%{opacity:.55;transform:scale(1)}50%{opacity:.25;transform:scale(1.06)} }
        @keyframes beacon-ring-2  { 0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.12;transform:scale(1.09)} }
        @keyframes beacon-star    { 0%,100%{opacity:1;transform:scale(1) rotate(0deg)}50%{opacity:.85;transform:scale(.96) rotate(15deg)} }
        @keyframes beacon-glow    { 0%,100%{opacity:.3}50%{opacity:.6} }
        @keyframes beacon-think   { 0%{transform:rotate(0deg)}100%{transform:rotate(360deg)} }
        @keyframes compass-wave   { 0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)} }
        .vcb-container { padding: 12px 16px 12px; background: transparent; }
        .vcb-btn {
          display: inline-flex; align-items: center; gap: 7px;
          height: 34px; padding: 0 14px;
          border: 1px solid var(--line-strong);
          font-size: 0.84rem; font-weight: 650; font-family: inherit;
          letter-spacing: -0.01em; cursor: pointer;
          transition: background .15s, border-color .15s, color .15s;
          white-space: nowrap; flex-shrink: 0;
        }
        .vcb-btn-idle    { background: var(--accent);  border-color: var(--accent);  color: var(--accent-text); }
        .vcb-btn-listen  { background: transparent;    border-color: var(--accent);  color: var(--accent); }
        .vcb-btn-process { background: var(--panel);   border-color: var(--line);    color: var(--muted); cursor:default; }
        .vcb-btn-results { background: var(--panel);   border-color: var(--accent);  color: var(--accent); }
        .vcb-btn-error   { background: var(--panel);   border-color: #DC2626;        color: #DC2626; }
        .compass-beacon-btn:hover .beacon-glow-radial { opacity:.7!important; }
        .compass-beacon-btn:hover .beacon-star-group  { filter:drop-shadow(0 0 2px rgba(69,137,255,.9)); }
        .vcb-btn-companion {
          width: 72px; height: 72px; border-radius: 50%; padding: 0;
          justify-content: center; flex-shrink: 0;
          box-shadow: 0 0 0 6px rgba(120, 169, 255, 0.08);
        }
        .vcb-btn-companion .vcb-btn-label { display: none; }
        @media(max-width:480px){ .vcb-btn:not(.vcb-btn-companion){width:100%;justify-content:center;} }
      `}</style>

      <div className={variant === "companion" ? "voice-companion-card" : "vcb-container"}>

        {variant === "companion" ? (
          <>
            <div className="voice-companion-head">
              <h2>Ask Compass</h2>
              <p>
                Sessions. People. Certifications. Community.
                What would you like help with?
              </p>
              <p className="compass-live-signal" aria-live="polite">
                {compassLiveSignalText()}
              </p>
            </div>

            <div className="voice-assistant-grid">
              {/* Left — Ask Compass trigger */}
              <div className="voice-assistant-mic">
                {!unsupported && (
                  <button
                    onClick={handleButtonClick}
                    disabled={isProcessing}
                    aria-live="polite"
                    aria-label={btnLabel}
                    className={[
                      "ask-compass-trigger",
                      isListening  ? "ask-compass-trigger--listening"
                      : isProcessing ? "ask-compass-trigger--processing"
                      : showResult   ? "ask-compass-trigger--result"
                      : showError    ? "ask-compass-trigger--error"
                      :                "",
                    ].join(" ")}
                  >
                    <span className="ask-compass-trigger-glow" aria-hidden="true" />
                    {isListening ? (
                      <span aria-hidden="true" className="ask-compass-trigger-wave">
                        {[0,1,2,3,4].map(i => (
                          <span key={i} style={{
                            animation: `compass-wave ${0.45 + i * 0.1}s ease-in-out infinite`,
                            animationDelay: `${i * 0.07}s`,
                          }} />
                        ))}
                      </span>
                    ) : (
                      <CompassBeacon state={isProcessing ? "thinking" : showResult ? "result" : "idle"} size={48} />
                    )}
                    <span className="ask-compass-trigger-title">Ask Compass</span>
                    <span className="ask-compass-trigger-sub">
                      {isListening ? "Listening…"
                        : isProcessing ? "Thinking…"
                        : showResult ? "Tap to ask again"
                        : showError ? "Tap to try again"
                        : "Prioritize your next move."}
                    </span>
                  </button>
                )}
              </div>

              {/* Center — prompt area */}
              <div className="voice-assistant-prompt">
                {transcript ? (
                  <p className="voice-assistant-prompt-text">&ldquo;{transcript}&rdquo;</p>
                ) : (
                  <p className="voice-assistant-prompt-text">
                    {isListening ? "Listening…" : "What should I do next?"}
                  </p>
                )}
                <p className="voice-assistant-prompt-hint">
                  Try &ldquo;What should I do next?&rdquo; · &ldquo;Who should I meet?&rdquo; · &ldquo;Why this session?&rdquo;
                </p>
              </div>

              {/* Right — response panel */}
              <div className="voice-assistant-response" aria-live="polite">
                <p className="voice-assistant-response-kicker">Compass says</p>
                {showError && (
                  <p className="voice-assistant-response-body" style={{ color: "#DC2626" }}>{errorMsg}</p>
                )}
                {(isThinking || isGenerating) && (
                  <p className="voice-assistant-response-idle">Thinking through your options…</p>
                )}
                {showResult && response && !showError && (
                  <p className="voice-assistant-response-body">{response.display}</p>
                )}
                {!showResult && !showError && !isProcessing && (
                  <p className="voice-assistant-response-idle">Tap the microphone to start.</p>
                )}
              </div>
            </div>

            {!unsupported && (
              <VoiceTonePicker tone={voiceTone} onChange={handleVoiceToneChange} />
            )}

            {unsupported && (
              <p style={{ color: "var(--muted)", fontSize: "0.84rem", margin: "12px 0 0", lineHeight: 1.5 }}>
                Voice not supported in this browser. Try Chrome or Edge.
              </p>
            )}

            {pendingAudioUrl && (
              <button
                type="button"
                onClick={() => { void playPendingVoice(); }}
                style={{
                  marginTop: "14px",
                  border: "1px solid var(--accent)",
                  background: "rgba(15,98,254,0.06)",
                  color: "var(--accent)",
                  padding: "8px 12px",
                  fontSize: "0.84rem",
                  cursor: "pointer",
                }}
              >
                ▶ Play Compass voice
              </button>
            )}

            {showResult && response && (
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "9px" }}>
                {showSessionCard && displaySession && (
                  <CompactCard
                    title={(displaySession as unknown as Record<string, unknown>).title as string ?? "Session"}
                    type="Session"
                    meta={sessionMeta || undefined}
                    why={sessionWhy}
                    infoHref="/txc/sessions"
                    sessionId={displaySession.id}
                    onAddToSchedule={onAddToSchedule}
                    onDoNotSuggestSession={onDoNotSuggestSession}
                  />
                )}
                {showChampionCard && topChampion && (
                  <CompactCard
                    title={(topChampion as unknown as Record<string, unknown>).display_name as string ?? "Champion"}
                    type="Champion"
                    meta={champMeta || undefined}
                    why={champWhy}
                    infoHref="/txc/champions"
                    championId={topChampion.id}
                    onSavePerson={onSavePerson}
                    onDoNotSuggestPerson={onDoNotSuggestPerson}
                  />
                )}
                {fallbackActivities.map(act => (
                  <CompactCard
                    key={act.id}
                    title={act.title}
                    type={act.type.replace(/_/g, " ")}
                    meta={[act.time, act.location].filter(Boolean).join(" · ") || undefined}
                    infoHref={act.primaryAction.href}
                  />
                ))}
                {!hasCard && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {response.action === "navigate_experience" && (
                      <a href="/experience" style={{ color: "var(--accent)", fontSize: "0.84rem", textDecoration: "none" }}>
                        Open My Experience →
                      </a>
                    )}
                    {response.action === "show_champions" && (
                      <a href="/champions" style={{ color: "var(--accent)", fontSize: "0.84rem", textDecoration: "none" }}>
                        View Champions →
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {!unsupported && (
              <p style={{ color: "var(--muted)", fontSize: "0.66rem", marginTop: "12px", lineHeight: 1.5, opacity: 0.5 }}>
                Voice processed in browser. Not stored.
              </p>
            )}
          </>
        ) : (
          <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <p style={{ color: "var(--accent)", fontSize: "0.69rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.13em", margin: 0, flexShrink: 0 }}>
            Compass Assistant
          </p>

          {!unsupported && (
            <button
              onClick={handleButtonClick}
              disabled={isProcessing}
              aria-live="polite"
              aria-label={btnLabel}
              className={[
                "vcb-btn compass-beacon-btn",
                isListening  ? "vcb-btn-listen"
                : isProcessing ? "vcb-btn-process"
                : showResult   ? "vcb-btn-results"
                : showError    ? "vcb-btn-error"
                :                "vcb-btn-idle",
              ].join(" ")}
            >
              {/* Waveform bars during listening */}
              {isListening && (
                <span aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: "2px", height: "14px" }}>
                  {[0,1,2,3,4].map(i => (
                    <span key={i} style={{
                      display: "block", width: "2px", height: "100%",
                      background: "var(--accent)", borderRadius: "2px",
                      transformOrigin: "center bottom",
                      animation: `compass-wave ${0.45 + i * 0.1}s ease-in-out infinite`,
                      animationDelay: `${i * 0.07}s`,
                    }} />
                  ))}
                </span>
              )}
              {/* Beacon when not listening */}
              {!isListening && (
                <CompassBeacon state={isProcessing ? "thinking" : showResult ? "result" : "idle"} />
              )}
              <span className="vcb-btn-label">{btnLabel}</span>
            </button>
          )}
        </div>

        {!unsupported && (
          <VoiceTonePicker tone={voiceTone} onChange={handleVoiceToneChange} />
        )}

        {/* ── Unsupported ───────────────────────────────────────────────────── */}
        {unsupported && (
          <p style={{ color: "var(--muted)", fontSize: "0.84rem", margin: "8px 0 0", lineHeight: 1.5 }}>
            Voice not supported in this browser. Try Chrome or Edge.
          </p>
        )}

        {/* ── Idle hint — minimal one-liner ─────────────────────────────────── */}
        {voiceState === "idle" && !unsupported && (
          <p style={{ color: "var(--muted)", fontSize: "0.73rem", margin: "7px 0 0", lineHeight: 1.5, opacity: 0.8 }}>
            Try: &ldquo;What is TechXchange?&rdquo; &middot; &ldquo;What&rsquo;s next?&rdquo; &middot; &ldquo;Anything fun tonight?&rdquo;
          </p>
        )}

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        {showError && (
          <div style={{ marginTop: "8px", padding: "7px 12px", background: "#FEF2F2", border: "1px solid #DC2626" }}>
            <p style={{ color: "#DC2626", fontSize: "0.84rem", margin: 0 }}>{errorMsg}</p>
          </div>
        )}

        {/* ── Result ────────────────────────────────────────────────────────── */}
        {showResult && response && (
          <div style={{ marginTop: "10px", borderTop: "1px solid var(--line)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "9px" }}>
            {transcript && (
              <p style={{ color: "var(--soft)", fontSize: "0.84rem", margin: 0, fontStyle: "italic", lineHeight: 1.4, opacity: 0.85 }}>
                &ldquo;{transcript}&rdquo;
              </p>
            )}

            {pendingAudioUrl && (
              <button
                type="button"
                onClick={() => { void playPendingVoice(); }}
                style={{
                  marginTop: "10px",
                  border: "1px solid var(--accent)",
                  background: "rgba(15,98,254,0.06)",
                  color: "var(--accent)",
                  padding: "8px 12px",
                  fontSize: "0.84rem",
                  cursor: "pointer",
                }}
              >
                ▶ Play Compass voice
              </button>
            )}

            {showSessionCard && displaySession && (
              <CompactCard
                title={(displaySession as unknown as Record<string, unknown>).title as string ?? "Session"}
                type="Session"
                meta={sessionMeta || undefined}
                why={sessionWhy}
                infoHref="/txc/sessions"
                sessionId={displaySession.id}
                onAddToSchedule={onAddToSchedule}
                onDoNotSuggestSession={onDoNotSuggestSession}
              />
            )}

            {showChampionCard && topChampion && (
              <CompactCard
                title={(topChampion as unknown as Record<string, unknown>).display_name as string ?? "Champion"}
                type="Champion"
                meta={champMeta || undefined}
                why={champWhy}
                infoHref="/txc/champions"
                championId={topChampion.id}
                onSavePerson={onSavePerson}
                onDoNotSuggestPerson={onDoNotSuggestPerson}
              />
            )}

            {fallbackActivities.map(act => (
              <CompactCard
                key={act.id}
                title={act.title}
                type={act.type.replace(/_/g, " ")}
                meta={[act.time, act.location].filter(Boolean).join(" · ") || undefined}
                infoHref={act.primaryAction.href}
              />
            ))}

            {!hasCard && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <p style={{ color: "var(--text)", fontSize: "0.9rem", lineHeight: 1.55, margin: 0 }}>
                  {response.display}
                </p>
                {response.action === "navigate_experience" && (
                  <a href="/experience" style={{ color: "var(--accent)", fontSize: "0.84rem", textDecoration: "none" }}>
                    Open My Experience →
                  </a>
                )}
                {response.action === "show_champions" && (
                  <a href="/champions" style={{ color: "var(--accent)", fontSize: "0.84rem", textDecoration: "none" }}>
                    View Champions →
                  </a>
                )}
                {response.action === "show_day" && (
                  <a href="/experience" style={{ color: "var(--accent)", fontSize: "0.84rem", textDecoration: "none" }}>
                    Open My Experience →
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {!unsupported && (
          <p style={{ color: "var(--muted)", fontSize: "0.66rem", marginTop: "9px", lineHeight: 1.5, opacity: 0.5 }}>
            Voice processed in browser. Not stored.
          </p>
        )}
          </>
        )}
      </div>
    </>
  );
}
