"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import EnergyIndicator from "@/components/experience/EnergyIndicator";
import WeekInBalance from "@/components/experience/WeekInBalance";
import CompassSignalCompact from "@/components/experience/CompassSignalCompact";
import {
  EVENT_DAYS,
  getSessionsForDay,
  type EventDay,
  type PlanConflictMode,
} from "@/lib/experienceDayPlan";
import { downloadIcsPlan } from "@/lib/icalExport";
import { recommendIbmCommunities } from "@/lib/ibmCommunityMatching";
import { enrichLinkedInForPerson } from "@/lib/demoLinkedInEnrichment";
import { useExperiencePageData } from "@/hooks/useExperiencePageData";
import type { ExperienceScoredSession } from "@/lib/experienceScoring";

function sessionTimeLabel(session: ExperienceScoredSession): string {
  const raw = session as unknown as Record<string, unknown>;
  const start = String(session.schedule?.start_time ?? session.start_time ?? raw.start_time ?? "");
  const end = String(session.schedule?.end_time ?? raw.end_time ?? "");
  if (start && end) return `${start} – ${end}`;
  return start || "TBA";
}

function sessionRoom(session: ExperienceScoredSession): string {
  const raw = session as unknown as Record<string, unknown>;
  return String(session.room ?? raw.room ?? session.schedule?.room ?? "TBA");
}

function PrintSessionTile({ session }: { session: ExperienceScoredSession }) {
  return (
    <article className="compass-print-session">
      <p className="compass-print-session__time">{sessionTimeLabel(session)}</p>
      <h3 className="compass-print-session__title">{session.title}</h3>
      <p className="compass-print-session__meta">{sessionRoom(session)}</p>
      {session.compass_score > 0 && (
        <p className="compass-print-session__match">{session.compass_score}% match</p>
      )}
    </article>
  );
}

export default function CompassPrintView() {
  const data = useExperiencePageData();
  const [planMode] = useState<PlanConflictMode>("best-fit");
  const [layout, setLayout] = useState<"landscape" | "portrait">("landscape");

  const ibmCommunities = useMemo(
    () =>
      recommendIbmCommunities({
        tracks: data.pTracks,
        goals: data.pGoals,
        products: data.pProducts,
        limit: 8,
      }),
    [data.pTracks, data.pGoals, data.pProducts],
  );

  const allPlanSessions = useMemo(() => {
    const ids = new Set<string>();
    const out: ExperienceScoredSession[] = [];
    for (const day of EVENT_DAYS) {
      for (const s of getSessionsForDay(data.learningList, day, planMode)) {
        if (!ids.has(s.id) && !data.hiddenSessions.includes(s.id)) {
          ids.add(s.id);
          out.push(s);
        }
      }
      for (const s of getSessionsForDay(data.communityList, day, planMode)) {
        if (!ids.has(s.id) && !data.hiddenSessions.includes(s.id)) {
          ids.add(s.id);
          out.push(s);
        }
      }
    }
    return out;
  }, [data.learningList, data.communityList, data.hiddenSessions, planMode]);

  const peopleBalanceCount = data.champions.filter(c => c.compass_score > 0).length;
  const peopleToMeet = data.recommendedPeople.slice(0, 8);

  if (data.status === "loading") {
    return (
      <div className="compass-print-page">
        <p className="compass-print-loading">Preparing your printable plan…</p>
      </div>
    );
  }

  if (data.status === "error" || !data.participant) {
    return (
      <div className="compass-print-page">
        <p className="compass-print-loading">{data.errorMsg ?? "Could not load plan."}</p>
        <Link href="/txc/experience" className="compass-print-toolbar__btn">
          Back to Compass
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className={`compass-print-page compass-print-page--${layout}`}>
      <div className="compass-print-toolbar no-print">
        <Link href="/txc/experience" className="compass-print-toolbar__btn">
          ← Back to Compass
        </Link>
        <div className="compass-print-toolbar__actions">
          <button
            type="button"
            className={`compass-print-toolbar__btn${layout === "landscape" ? " is-active" : ""}`}
            onClick={() => setLayout("landscape")}
          >
            Landscape
          </button>
          <button
            type="button"
            className={`compass-print-toolbar__btn${layout === "portrait" ? " is-active" : ""}`}
            onClick={() => setLayout("portrait")}
          >
            Portrait
          </button>
          <button
            type="button"
            className="compass-print-toolbar__btn compass-print-toolbar__btn--primary"
            onClick={() => downloadIcsPlan(allPlanSessions)}
          >
            Download calendar (.ics)
          </button>
          <button
            type="button"
            className="compass-print-toolbar__btn compass-print-toolbar__btn--accent"
            onClick={handlePrint}
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <header className="compass-print-header">
        <p className="compass-print-header__brand">Compass — IBM TechXchange 2026</p>
        <p className="compass-print-header__event">Atlanta, GA · Oct 26–30, 2026</p>
      </header>

      <section className="compass-print-attendee">
        <div className="compass-print-attendee__identity">
          <h1 className="compass-print-attendee__name">{data.displayName}</h1>
          <p className="compass-print-attendee__role">
            {[data.participant.job_title, data.participant.organization ?? data.participant.company]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="compass-print-attendee__meters">
          <EnergyIndicator
            learning={data.learningList.length}
            community={data.communityList.length}
            fun={data.funList.length}
            strip
          />
          <WeekInBalance
            people={peopleBalanceCount}
            learning={data.learningList.length}
            community={data.communityList.length}
            fun={data.funList.length}
            strip
          />
          <CompassSignalCompact participant={data.participant} strip />
        </div>
      </section>

      {EVENT_DAYS.map(day => {
        const daySessions = [
          ...getSessionsForDay(data.learningList, day as EventDay, planMode),
          ...getSessionsForDay(data.communityList, day as EventDay, planMode),
        ].filter(s => !data.hiddenSessions.includes(s.id));

        if (daySessions.length === 0) return null;

        return (
          <section key={day} className="compass-print-day print-page-break">
            <h2 className="compass-print-day__title">{day}</h2>
            <div className="compass-print-session-grid">
              {daySessions.map(session => (
                <PrintSessionTile key={session.id} session={session} />
              ))}
            </div>
          </section>
        );
      })}

      {ibmCommunities.length > 0 && (
        <section className="compass-print-section print-page-break">
          <h2 className="compass-print-section__title">IBM Communities for you</h2>
          <div className="compass-print-community-grid">
            {ibmCommunities.map(c => (
              <article key={c.community_id} className="compass-print-community">
                <h3 className="compass-print-community__name">{c.name}</h3>
                <p className="compass-print-community__meta">{c.type}</p>
                {c.matchReasons?.[0] && (
                  <p className="compass-print-community__reason">{c.matchReasons[0]}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {peopleToMeet.length > 0 && (
        <section className="compass-print-section compass-print-people print-page-break">
          <h2 className="compass-print-section__title">People I should meet</h2>
          <div className="compass-print-people-grid">
            {peopleToMeet.map(person => {
              const linkedIn = enrichLinkedInForPerson(person);
              return (
                <article key={person.id} className="compass-print-person">
                  <h3 className="compass-print-person__name">{person.display_name}</h3>
                  {(person.title || person.organization) && (
                    <p className="compass-print-person__role">
                      {[person.title, person.organization ?? person.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {person.compass_reasons?.[0] && (
                    <p className="compass-print-person__reason">{person.compass_reasons[0]}</p>
                  )}
                  <div className="compass-print-person__footer">
                    {linkedIn?.linkedinVisibility === "visible" && linkedIn.linkedin_url ? (
                      <span className="compass-print-person__linkedin">LinkedIn · shared</span>
                    ) : linkedIn?.linkedinVisibility === "consent_blocked" ? (
                      <span className="compass-print-person__linkedin compass-print-person__linkedin--muted">
                        LinkedIn · not shared
                      </span>
                    ) : null}
                    <span className="compass-print-person__actions">Details · Save</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <footer className="compass-print-footer">
        <p>Generated by EventCompass · IBM TechXchange 2026</p>
      </footer>
    </div>
  );
}
