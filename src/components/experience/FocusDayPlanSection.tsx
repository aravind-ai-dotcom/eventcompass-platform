"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import FocusSessionCard from "@/components/experience/FocusSessionCard";
import PlanModeSelector from "@/components/experience/PlanModeSelector";
import {
  EVENT_DAYS,
  EVENT_DAY_SHORT,
  groupDaySessions,
  type EventDay,
  type PlanConflictMode,
} from "@/lib/experienceDayPlan";
import {
  PORTFOLIO_CATEGORY_META,
  type LearningPortfolioCategory,
} from "@/lib/learningPortfolioCategories";
import { focusDayToGroups, type FocusSessionPlan } from "@/lib/sessionFocusPlan";
import { downloadIcsPlan } from "@/lib/icalExport";
import type { ExperienceScoredSession } from "@/lib/experienceScoring";

interface Props {
  focusPlan: FocusSessionPlan;
  learningList: ExperienceScoredSession[];
  communityList: ExperienceScoredSession[];
  hiddenSessionIds: string[];
  certLabel: string | null;
  savedSessionIds: string[];
  onSaveSession?: (id: string) => void;
}

const PORTFOLIO_SECTIONS: Array<{
  key: LearningPortfolioCategory | "labs";
  groupKey: "core" | "cert" | "perspective" | "networking" | "labs";
}> = [
  { key: "CORE", groupKey: "core" },
  { key: "labs", groupKey: "labs" },
  { key: "CERTIFICATION", groupKey: "cert" },
  { key: "PERSPECTIVE", groupKey: "perspective" },
  { key: "NETWORKING", groupKey: "networking" },
];

function PortfolioSessionGroup({
  category,
  label,
  badge,
  purpose,
  sessions,
  certLabel,
  savedSessionIds,
  onSaveSession,
  initialVisible = 4,
  defaultExpanded = true,
  essentialFlag = false,
}: {
  category?: LearningPortfolioCategory;
  label: string;
  badge: string;
  purpose?: string;
  sessions: ExperienceScoredSession[];
  certLabel: string | null;
  savedSessionIds: string[];
  onSaveSession?: (id: string) => void;
  initialVisible?: number;
  defaultExpanded?: boolean;
  essentialFlag?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);

  if (sessions.length === 0) return null;

  const visible = showAll ? sessions : sessions.slice(0, initialVisible);

  return (
    <div className={`focus-learning-group focus-learning-group--${badge.toLowerCase()}`}>
      <button
        type="button"
        className="focus-learning-group__header"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <div className="focus-learning-group__header-copy">
          <div className="focus-learning-group__title-row">
            <span className={`portfolio-badge portfolio-badge--${badge.toLowerCase()}`}>{badge}</span>
            <h3 className="focus-learning-group__label">{label}</h3>
            <span className="focus-learning-group__count">{sessions.length}</span>
          </div>
          {purpose && (
            <p className="focus-learning-group__purpose">{purpose}</p>
          )}
        </div>
        <span className="focus-learning-group__toggle" aria-hidden="true">
          {expanded ? "−" : "+"}
        </span>
      </button>

      {essentialFlag && expanded && (
        <p className="focus-learning-group__flag">Essential for Certification</p>
      )}

      {expanded && (
        <>
          <div className="opportunity-grid three focus-session-grid">
            {visible.map(session => (
              <FocusSessionCard
                key={session.id}
                session={session}
                certLabel={certLabel}
                saved={savedSessionIds.includes(session.id)}
                onSave={onSaveSession}
                portfolioCategory={category}
              />
            ))}
          </div>
          {sessions.length > initialVisible && (
            <button
              type="button"
              className="focus-view-more"
              onClick={() => setShowAll(v => !v)}
            >
              {showAll ? "Show less" : `View ${sessions.length - initialVisible} more`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function FocusDayPlanSection({
  focusPlan,
  learningList,
  communityList,
  hiddenSessionIds,
  certLabel,
  savedSessionIds,
  onSaveSession,
}: Props) {
  const [activeDay, setActiveDay] = useState<EventDay>("Monday");
  const [planMode, setPlanMode] = useState<PlanConflictMode>("best-fit");

  const groups = useMemo(() => {
    if (planMode === "show-both") {
      return groupDaySessions(learningList, communityList, activeDay, hiddenSessionIds, planMode);
    }
    return focusDayToGroups(focusPlan.byDay[activeDay]);
  }, [planMode, learningList, communityList, activeDay, hiddenSessionIds, focusPlan]);

  const hasContent =
    groups.core.length > 0
    || groups.cert.length > 0
    || groups.perspective.length > 0
    || groups.networking.length > 0
    || groups.labs.length > 0;

  const exportSessions = focusPlan.printLearning.filter(s => !hiddenSessionIds.includes(s.id));

  return (
    <>
      <header className="focus-learning-plan-head">
        <h2 className="focus-learning-plan-head__title">Your Learning Plan</h2>
        <p className="focus-learning-plan-head__desc">
          A curated plan based on your interests, goals, and certifications.
        </p>
      </header>

      <PlanModeSelector value={planMode} onChange={setPlanMode} limit={2} />

      <div className="focus-plan-export no-print">
        <Link href="/txc/experience/print" className="focus-plan-export__btn focus-plan-export__btn--primary">
          Open printable plan
        </Link>
        <button
          type="button"
          className="focus-plan-export__btn"
          onClick={() => downloadIcsPlan(exportSessions)}
        >
          Download calendar (.ics)
        </button>
      </div>

      <div role="tablist" aria-label="Event days" className="day-tab-list focus-day-tab-list">
        {EVENT_DAYS.map(day => (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={activeDay === day}
            onClick={() => setActiveDay(day)}
            aria-label={day}
            className={`day-tab${activeDay === day ? " is-active" : ""}`}
          >
            {EVENT_DAY_SHORT[day]}
          </button>
        ))}
      </div>

      {!hasContent ? (
        <p className="focus-compass-section__desc" style={{ marginTop: "12px" }}>
          No sessions scheduled for {activeDay} yet. Check back as the catalog updates.
        </p>
      ) : (
        <>
          {PORTFOLIO_SECTIONS.map(section => {
            if (section.key === "labs") {
              if (groups.labs.length === 0) return null;
              return (
                <PortfolioSessionGroup
                  key="labs"
                  label="Labs & workshops"
                  badge="CORE"
                  purpose="Hands-on practice for your core goals"
                  sessions={groups.labs}
                  certLabel={certLabel}
                  savedSessionIds={savedSessionIds}
                  onSaveSession={onSaveSession}
                  initialVisible={2}
                  category="CORE"
                />
              );
            }

            const meta = PORTFOLIO_CATEGORY_META[section.key];
            const sessions = groups[section.groupKey];

            return (
              <PortfolioSessionGroup
                key={section.key}
                category={section.key}
                label={meta.label}
                badge={meta.badge}
                purpose={meta.purpose}
                sessions={sessions}
                certLabel={certLabel}
                savedSessionIds={savedSessionIds}
                onSaveSession={onSaveSession}
                initialVisible={section.key === "CORE" ? 5 : section.key === "CERTIFICATION" ? 3 : 2}
                essentialFlag={section.key === "CERTIFICATION" && sessions.length > 0}
              />
            );
          })}
        </>
      )}
    </>
  );
}
