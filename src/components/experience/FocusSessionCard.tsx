"use client";

import Link from "next/link";
import SessionIntelligencePanel from "@/components/sessions/SessionIntelligencePanel";
import {
  experienceSessionMeta,
  experienceSessionTypeLabel,
  type ExperienceScoredSession,
} from "@/lib/experienceScoring";

interface FocusSessionCardProps {
  session: ExperienceScoredSession;
  certLabel: string | null;
  saved?: boolean;
  onSave?: (id: string) => void;
}

export default function FocusSessionCard({
  session,
  certLabel,
  saved = false,
  onSave,
}: FocusSessionCardProps) {
  const type = experienceSessionTypeLabel(session);
  const track = session.tracks?.primary_track ?? "";
  const meta = experienceSessionMeta(session);

  return (
    <article className="opportunity-card focus-session-card">
      <div className="card-meta">
        <span>{type}{track ? ` · ${track}` : ""}</span>
      </div>
      <h3>{session.title}</h3>
      {meta && <p className="session-card-meta">{meta}</p>}
      <SessionIntelligencePanel session={session} certLabel={certLabel} scoreSize="sm" />
      <div className="focus-session-card__actions">
        <Link href="/txc/sessions" className="action-chip action-chip--quiet">
          Info →
        </Link>
        {onSave && (
          <button
            type="button"
            className={`action-chip${saved ? " action-chip--saved" : ""}`}
            onClick={() => onSave(session.id)}
          >
            {saved ? "✓ Saved" : "+ Save"}
          </button>
        )}
      </div>
    </article>
  );
}
