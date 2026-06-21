"use client";

import Link from "next/link";
import SessionIntelligencePanel from "@/components/sessions/SessionIntelligencePanel";
import {
  experienceSessionMeta,
  experienceSessionTypeLabel,
  type ExperienceScoredSession,
} from "@/lib/experienceScoring";
import type { LearningPortfolioCategory } from "@/lib/learningPortfolioCategories";
import { PORTFOLIO_CATEGORY_META } from "@/lib/learningPortfolioCategories";

interface FocusSessionCardProps {
  session: ExperienceScoredSession;
  certLabel: string | null;
  saved?: boolean;
  onSave?: (id: string) => void;
  portfolioCategory?: LearningPortfolioCategory;
}

export default function FocusSessionCard({
  session,
  certLabel,
  saved = false,
  onSave,
  portfolioCategory,
}: FocusSessionCardProps) {
  const type = experienceSessionTypeLabel(session);
  const track = session.tracks?.primary_track ?? "";
  const meta = experienceSessionMeta(session);
  const category = portfolioCategory ?? session.portfolio_category;
  const badge = category ? PORTFOLIO_CATEGORY_META[category].badge : null;

  return (
    <article className="opportunity-card focus-session-card">
      <div className="card-meta">
        <span>{type}{track ? ` · ${track}` : ""}</span>
        {badge && (
          <span className={`portfolio-badge portfolio-badge--${badge.toLowerCase()} portfolio-badge--inline`}>
            {badge}
          </span>
        )}
      </div>
      <h3>{session.title}</h3>
      {meta && <p className="session-card-meta">{meta}</p>}
      <SessionIntelligencePanel session={session} certLabel={certLabel} scoreSize="sm" initialVisible={4} />
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
