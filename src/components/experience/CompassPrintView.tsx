"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FORGE_EVENT, FORGE_PRODUCT } from "@/config/forgeBrand";
import EnergyIndicator from "@/components/experience/EnergyIndicator";
import WeekInBalance from "@/components/experience/WeekInBalance";
import CompassSignalCompact from "@/components/experience/CompassSignalCompact";
import { EVENT_DAYS, type EventDay } from "@/lib/experienceDayPlan";
import { downloadIcsPlan } from "@/lib/icalExport";
import { enrichLinkedInForPerson } from "@/lib/demoLinkedInEnrichment";
import { focusDayToGroups } from "@/lib/sessionFocusPlan";
import { sessionDisplayTime } from "@/lib/sessionTimeUtils";
import { useExperiencePageData } from "@/hooks/useExperiencePageData";
import type { ExperienceScoredSession } from "@/lib/experienceScoring";

function sessionTimeLabel(session: ExperienceScoredSession): string {
  return sessionDisplayTime(session);
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
  const [layout, setLayout] = useState<"landscape" | "portrait">("landscape");

  const ibmCommunities = data.recommendedIbmCommunities.slice(0, 5);

  const printPlan = data.focusSessionPlan;
  const exportSessions = printPlan.printLearning.filter(s => !data.hiddenSessions.includes(s.id));

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
            onClick={() => downloadIcsPlan(exportSessions)}
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
        <p className="compass-print-header__brand">Compass — {FORGE_EVENT.name}</p>
        <p className="compass-print-header__event">{FORGE_EVENT.locationLine} · {FORGE_EVENT.dates}</p>
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
            learning={printPlan.printLearning.length}
            community={data.communityList.length}
            fun={data.funList.length}
            strip
          />
          <WeekInBalance
            people={peopleBalanceCount}
            learning={printPlan.printLearning.length}
            community={ibmCommunities.length}
            fun={printPlan.exploreAnytime.length}
            strip
          />
          <CompassSignalCompact participant={data.participant} strip />
        </div>
      </section>

      {printPlan.mustAttend.length > 0 && (
        <section className="compass-print-section">
          <h2 className="compass-print-section__title">My Must Attend Plan</h2>
          <div className="compass-print-session-grid">
            {printPlan.mustAttend.map(session => (
              <PrintSessionTile key={session.id} session={session} />
            ))}
          </div>
        </section>
      )}

      {EVENT_DAYS.map(day => {
        const groups = focusDayToGroups(printPlan.byDay[day as EventDay]);
        const daySessions = [
          ...groups.core.filter(s => !printPlan.mustAttend.some(m => m.id === s.id)),
          ...groups.labs,
        ].filter(s => !data.hiddenSessions.includes(s.id));

        if (daySessions.length === 0) return null;

        return (
          <section key={day} className="compass-print-day print-page-break">
            <h2 className="compass-print-day__title">{day} — Strong matches</h2>
            <div className="compass-print-session-grid">
              {daySessions.map(session => (
                <PrintSessionTile key={session.id} session={session} />
              ))}
            </div>
          </section>
        );
      })}

      {printPlan.exploreAnytime.length > 0 && (
        <section className="compass-print-section print-page-break">
          <h2 className="compass-print-section__title">Explore Anytime</h2>
          <div className="compass-print-session-grid">
            {printPlan.exploreAnytime.map(session => (
              <PrintSessionTile key={session.id} session={session} />
            ))}
          </div>
        </section>
      )}

      {data.enrolledCertificationViews.length > 0 && (
        <section className="compass-print-section print-page-break">
          <h2 className="compass-print-section__title">My Certifications</h2>
          <div className="compass-print-cert-grid">
            {data.enrolledCertificationViews.map(view => (
              <article key={view.certification.certification_id} className="compass-print-cert">
                <h3 className="compass-print-cert__title">{view.certification.title}</h3>
                <p className="compass-print-cert__meta">
                  Readiness {view.readiness}% · {view.certification.product} · {view.certification.level}
                </p>
                {view.supportingSessions.length > 0 && (
                  <div className="compass-print-cert__block">
                    <p className="compass-print-cert__label">Supporting sessions</p>
                    <ul>
                      {view.supportingSessions.map(session => (
                        <li key={session.id}>{session.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {view.supportingPeople.length > 0 && (
                  <div className="compass-print-cert__block">
                    <p className="compass-print-cert__label">People</p>
                    <ul>
                      {view.supportingPeople.map(person => (
                        <li key={person.id}>{person.display_name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="compass-print-cert__link">{view.certification.certification_url}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {ibmCommunities.length > 0 && (
        <section className="compass-print-section print-page-break">
          <h2 className="compass-print-section__title">Communities for Me</h2>
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
        <p>Generated by EventCompass · {FORGE_EVENT.name}</p>
      </footer>
    </div>
  );
}
