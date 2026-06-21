"use client";

import { useState } from "react";
import Link from "next/link";
import FocusSessionCard from "@/components/experience/FocusSessionCard";
import PlanModeSelector from "@/components/experience/PlanModeSelector";
import {
  EVENT_DAYS,
  groupDaySessions,
  getSessionsForDay,
  type EventDay,
  type PlanConflictMode,
} from "@/lib/experienceDayPlan";
import { downloadIcsPlan } from "@/lib/icalExport";
import type { ExperienceScoredSession } from "@/lib/experienceScoring";

interface Props {
  learningList: ExperienceScoredSession[];
  communityList: ExperienceScoredSession[];
  hiddenSessionIds: string[];
  certLabel: string | null;
  savedSessionIds: string[];
  onSaveSession?: (id: string) => void;
}

function SessionGroup({
  label,
  sessions,
  certLabel,
  savedSessionIds,
  onSaveSession,
  initialVisible = 3,
}: {
  label: string;
  sessions: ExperienceScoredSession[];
  certLabel: string | null;
  savedSessionIds: string[];
  onSaveSession?: (id: string) => void;
  initialVisible?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  if (sessions.length === 0) return null;

  const visible = expanded ? sessions : sessions.slice(0, initialVisible);

  return (
    <div className="focus-learning-group">
      <h3 className="focus-learning-group__label">{label}</h3>
      <div className="opportunity-grid three focus-session-grid">
        {visible.map(session => (
          <FocusSessionCard
            key={session.id}
            session={session}
            certLabel={certLabel}
            saved={savedSessionIds.includes(session.id)}
            onSave={onSaveSession}
          />
        ))}
      </div>
      {sessions.length > initialVisible && (
        <button
          type="button"
          className="focus-view-more"
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? "Show less" : `View ${sessions.length - initialVisible} more`}
        </button>
      )}
    </div>
  );
}

export default function FocusDayPlanSection({
  learningList,
  communityList,
  hiddenSessionIds,
  certLabel,
  savedSessionIds,
  onSaveSession,
}: Props) {
  const [activeDay, setActiveDay] = useState<EventDay>("Monday");
  const [planMode, setPlanMode] = useState<PlanConflictMode>("best-fit");

  const { core, cert, perspective } = groupDaySessions(
    learningList,
    communityList,
    activeDay,
    hiddenSessionIds,
    planMode,
  );

  const hasContent = core.length > 0 || cert.length > 0 || perspective.length > 0;

  const exportSessions = EVENT_DAYS.flatMap(day => {
    const ids = new Set<string>();
    const rows: ExperienceScoredSession[] = [];
    for (const s of [
      ...getSessionsForDay(learningList, day, planMode),
      ...getSessionsForDay(communityList, day, planMode),
    ]) {
      if (!hiddenSessionIds.includes(s.id) && !ids.has(s.id)) {
        ids.add(s.id);
        rows.push(s);
      }
    }
    return rows;
  });

  return (
    <>
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
            className={`day-tab${activeDay === day ? " is-active" : ""}`}
          >
            {day}
          </button>
        ))}
      </div>

      {!hasContent ? (
        <p className="focus-compass-section__desc" style={{ marginTop: "12px" }}>
          No sessions scheduled for {activeDay} yet. Check back as the catalog updates.
        </p>
      ) : (
        <>
          <SessionGroup
            label="Core learning"
            sessions={core}
            certLabel={certLabel}
            savedSessionIds={savedSessionIds}
            onSaveSession={onSaveSession}
          />
          <SessionGroup
            label="Certification support"
            sessions={cert}
            certLabel={certLabel}
            savedSessionIds={savedSessionIds}
            onSaveSession={onSaveSession}
          />
          <SessionGroup
            label="Industry & peer perspective"
            sessions={perspective}
            certLabel={certLabel}
            savedSessionIds={savedSessionIds}
            onSaveSession={onSaveSession}
          />
        </>
      )}
    </>
  );
}
