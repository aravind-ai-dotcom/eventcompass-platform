"use client";

import { useEffect } from "react";
import { isCertificationActivityType } from "@/lib/certificationProfile";
import CertificationSessionDetail from "@/components/sessions/CertificationSessionDetail";
import SessionSpeakerPanel from "@/components/sessions/SessionSpeakerPanel";
import {
  resolveSpeakersForSession,
  sessionFromScored,
  type SpeakerParticipantContext,
} from "@/lib/speakerIntelligence";
import type { SpeakerProfile } from "@/types/speaker";

type RawDoc = Record<string, unknown>;

export interface SessionDetailModalSession {
  id: string;
  title: string;
  session_type?: string;
  activity_type?: string;
  schedule?: { day?: string; date?: string; start_time?: string; end_time?: string; room?: string };
  tracks?: { primary_track?: string; secondary_tracks?: string[]; topics?: string[]; products?: string[] };
  date?: string;
  start_time?: string;
  room?: string;
  tech_track?: string | string[];
  compass_score: number;
  compass_reasons: string[];
  speakers?: unknown;
  certification_id?: string;
  certification_code?: string;
  certification_url?: string;
  guide_url?: string;
  certification_level?: string;
  skills_measured?: string[];
  recommended_background?: string[];
  estimated_preparation_hours?: number;
  supports_certification?: boolean;
  recommended_reason?: string;
  related_session_ids?: string[];
  related_lab_ids?: string[];
  related_champion_ids?: string[];
  related_huddle_ids?: string[];
  related_community_ids?: string[];
}

function resolve(raw: RawDoc, legacyKey: string, nestedPath: string): string {
  let cur: unknown = raw;
  for (const p of nestedPath.split(".")) {
    if (!cur || typeof cur !== "object") { cur = undefined; break; }
    cur = (cur as RawDoc)[p];
  }
  if (typeof cur === "string" && cur.trim()) return cur;
  const flat = raw[legacyKey];
  return typeof flat === "string" && flat.trim() ? flat : "";
}

function sessionType(s: SessionDetailModalSession): string {
  return (s.session_type ?? s.activity_type ?? "Session").trim();
}

function sessionDay(s: SessionDetailModalSession): string {
  return resolve(s as unknown as RawDoc, "date", "schedule.day");
}

function sessionStart(s: SessionDetailModalSession): string {
  return resolve(s as unknown as RawDoc, "start_time", "schedule.start_time");
}

function sessionRoom(s: SessionDetailModalSession): string {
  return resolve(s as unknown as RawDoc, "room", "schedule.room");
}

function sessionMeta(s: SessionDetailModalSession): string {
  if (isCertificationActivityType(s)) return "";
  return [sessionDay(s), sessionStart(s), sessionRoom(s)].filter(Boolean).join(" · ");
}

function primaryTrack(s: SessionDetailModalSession): string {
  return s.tracks?.primary_track ?? "";
}

export interface SessionDetailModalProps {
  session: SessionDetailModalSession;
  allSessions: SessionDetailModalSession[];
  speakerCatalog: SpeakerProfile[];
  speakerCtx: SpeakerParticipantContext;
  onViewSpeaker?: (speakerId: string) => void;
  anonymous?: boolean;
  onClose: () => void;
}

export default function SessionDetailModal({
  session,
  allSessions,
  speakerCatalog,
  speakerCtx,
  onViewSpeaker,
  anonymous = false,
  onClose,
}: SessionDetailModalProps) {
  const type = sessionType(session);
  const track = primaryTrack(session);
  const meta = sessionMeta(session);
  const tags = [
    ...(session.tracks?.topics ?? []),
    ...(session.tracks?.products ?? []),
    ...(session.tracks?.secondary_tracks ?? []),
  ].filter(Boolean);
  const isCertJourney = isCertificationActivityType(session);
  const sessionSpeakers = resolveSpeakersForSession(
    sessionFromScored(session),
    speakerCatalog,
    speakerCtx,
  );
  const primarySpeaker = sessionSpeakers[0];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="session-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-modal-title"
      onClick={onClose}
    >
      <div className={`session-modal${isCertJourney ? " session-modal--certification" : ""}`} onClick={e => e.stopPropagation()}>
        <button type="button" className="session-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {isCertJourney ? (
          <CertificationSessionDetail session={session} allSessions={allSessions} onClose={onClose} />
        ) : (
          <>
            <p style={{ color: "var(--accent)", fontSize: "0.68rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>
              {type}{track ? ` · ${track}` : ""}
            </p>
            <h2 id="session-modal-title">{session.title}</h2>
            {meta && <p className="session-modal-meta">{meta}</p>}
            {session.compass_score > 0 && (
              <p style={{ fontSize: "0.88rem", color: "var(--text)", margin: "0 0 16px" }}>
                Compass match: <strong>{session.compass_score}</strong>
              </p>
            )}
            {tags.length > 0 && (
              <div className="chip-row" style={{ marginBottom: "16px" }}>
                {tags.slice(0, 8).map(tag => <span key={tag} className="chip">{tag}</span>)}
              </div>
            )}
            {session.compass_reasons.length > 0 && (
              <>
                <p style={{ color: "var(--muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 680, margin: "0 0 8px" }}>
                  Why Compass matched this
                </p>
                <ul className="session-modal-reasons">
                  {session.compass_reasons.map(r => <li key={r}>{r}</li>)}
                </ul>
              </>
            )}
            {primarySpeaker && (
              <SessionSpeakerPanel
                speaker={primarySpeaker}
                currentSessionId={session.id}
                allSessions={allSessions.map(sessionFromScored)}
                onViewProfile={onViewSpeaker}
                anonymous={anonymous}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
