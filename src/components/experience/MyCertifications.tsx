"use client";

import { useState } from "react";
import Link from "next/link";
import CertificationPickerModal from "@/components/experience/CertificationPickerModal";
import { CERTIFICATION_JOURNEY_COPY } from "@/lib/certificationProfile";
import { shortenCertificationTitle } from "@/lib/certificationJourneyIntelligence";
import { experienceSessionMeta } from "@/lib/experienceScoring";
import type { TxCertification } from "@/data/certifications";
import { MAX_CERTIFICATION_ENROLLMENTS } from "@/data/certifications";
import type { EnrolledCertificationView } from "@/lib/certificationMatching";

interface MyCertificationsProps {
  views: EnrolledCertificationView[];
  catalog: TxCertification[];
  enrolledIds: string[];
  enrollmentError: string | null;
  onEnroll: (certificationId: string) => void;
  onRemove: (certificationId: string) => void;
  onClearError: () => void;
}

function PlanTile({
  label,
  items,
  emptyCopy,
}: {
  label: string;
  items: Array<{ id: string; title: string; meta?: string; href: string; external?: boolean }>;
  emptyCopy: string;
}) {
  return (
    <article className="cert-panel__tile">
      <header className="cert-panel__tile-head">
        <span className="cert-panel__tile-index" aria-hidden="true" />
        <h4 className="cert-panel__tile-label">{label}</h4>
      </header>
      <div className="cert-panel__tile-body">
        {items.length > 0 ? (
          <ul className="cert-panel__links">
            {items.map(item => (
              <li key={item.id} className="cert-panel__link-row">
                {item.external ? (
                  <a
                    href={item.href}
                    className="cert-panel__link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="cert-panel__link-title">{item.title}</span>
                    {item.meta && <span className="cert-panel__link-meta">{item.meta}</span>}
                  </a>
                ) : (
                  <Link href={item.href} className="cert-panel__link">
                    <span className="cert-panel__link-title">{item.title}</span>
                    {item.meta && <span className="cert-panel__link-meta">{item.meta}</span>}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="cert-panel__empty">{emptyCopy}</p>
        )}
      </div>
    </article>
  );
}

function CertificationPanel({
  view,
  expanded,
  onToggle,
  onRemove,
}: {
  view: EnrolledCertificationView;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { certification, readiness, reasonLine, sessionCount, peopleCount, communityCount } = view;
  const shortTitle = shortenCertificationTitle(certification.title);

  const sessionItems = view.supportingSessions.map(session => ({
    id: session.id,
    title: session.title,
    meta: experienceSessionMeta(session) || undefined,
    href: "/txc/sessions",
  }));

  const peopleItems = view.supportingPeople.map(person => ({
    id: person.id,
    title: person.display_name,
    meta: [person.title, person.organization ?? person.company].filter(Boolean).join(" · ") || undefined,
    href: "/txc/champions",
  }));

  const communityItems = view.supportingCommunities.map(community => ({
    id: community.community_id,
    title: community.name,
    meta: community.category || community.primary_product || undefined,
    href: community.url || "/txc/communities",
    external: !!community.url,
  }));

  return (
    <article className="cert-panel cert-panel--focus">
      <div className="cert-panel__rail" aria-hidden="true" />
      <div className="cert-panel__main">
        <header className="cert-panel__hero">
          <div className="cert-panel__hero-top">
            <p className="cert-panel__eyebrow">{CERTIFICATION_JOURNEY_COPY.sectionKicker}</p>
            <div className="cert-panel__hero-actions">
              <button
                type="button"
                className="cert-panel__btn cert-panel__btn--ghost cert-panel__btn--compact"
                onClick={onToggle}
              >
                {expanded ? "Hide plan" : "Explore plan"}
              </button>
              <button type="button" className="cert-panel__btn cert-panel__btn--compact" onClick={onRemove}>
                Remove
              </button>
            </div>
          </div>

          <div className="cert-panel__hero-row">
            <div className="cert-panel__goal">
              <p className="cert-panel__goal-kicker">{CERTIFICATION_JOURNEY_COPY.workingToward}</p>
              <h3 className="cert-panel__goal-title">{shortTitle}</h3>
              <p className="cert-panel__goal-sub">{reasonLine}</p>
            </div>
            <dl className="cert-panel__meta">
              <div className="cert-panel__meta-item">
                <dt>Readiness</dt>
                <dd>{readiness}%</dd>
              </div>
              <div className="cert-panel__meta-item">
                <dt>Product</dt>
                <dd>{certification.product}</dd>
              </div>
              <div className="cert-panel__meta-item">
                <dt>Level</dt>
                <dd>{certification.level}</dd>
              </div>
              {certification.exam_code && (
                <div className="cert-panel__meta-item">
                  <dt>Exam</dt>
                  <dd>{certification.exam_code}</dd>
                </div>
              )}
            </dl>
          </div>
        </header>

        <div className="cert-panel__stats" role="group" aria-label={CERTIFICATION_JOURNEY_COPY.progressSummary}>
          <div className="cert-panel__stat">
            <span className="cert-panel__stat-value">{sessionCount}</span>
            <span className="cert-panel__stat-label">{CERTIFICATION_JOURNEY_COPY.recommendedSessions}</span>
          </div>
          <div className="cert-panel__stat">
            <span className="cert-panel__stat-value">{peopleCount}</span>
            <span className="cert-panel__stat-label">{CERTIFICATION_JOURNEY_COPY.experts}</span>
          </div>
          <div className="cert-panel__stat">
            <span className="cert-panel__stat-value">{communityCount}</span>
            <span className="cert-panel__stat-label">Communities</span>
          </div>
        </div>

        {expanded && (
          <div className="cert-panel__grid cert-panel__grid--focus">
            <PlanTile
              label={CERTIFICATION_JOURNEY_COPY.recommendedSessions}
              items={sessionItems}
              emptyCopy="Sessions will appear as Compass matches your certification path."
            />
            <PlanTile
              label={CERTIFICATION_JOURNEY_COPY.experts}
              items={peopleItems}
              emptyCopy="Experts and champions aligned to this certification will appear here."
            />
            <PlanTile
              label="Community"
              items={communityItems}
              emptyCopy="IBM Communities supporting this path will appear here."
            />
          </div>
        )}

        <footer className="cert-panel__footer">
          <a
            href={certification.certification_url}
            target="_blank"
            rel="noopener noreferrer"
            className="cert-panel__btn cert-panel__btn--primary cert-panel__btn--compact"
          >
            IBM Training ↗
          </a>
          <Link href="/txc/sessions?view=learning-paths" className="cert-panel__btn cert-panel__btn--compact">
            {CERTIFICATION_JOURNEY_COPY.viewAllSessions}
          </Link>
        </footer>
      </div>
    </article>
  );
}

export default function MyCertifications({
  views,
  catalog,
  enrolledIds,
  enrollmentError,
  onEnroll,
  onRemove,
  onClearError,
}: MyCertificationsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (views.length === 0) {
    return (
      <>
        <article className="cert-panel cert-panel--empty cert-panel--focus">
          <div className="cert-panel__rail" aria-hidden="true" />
          <div className="cert-panel__main">
            <div className="cert-panel__hero cert-panel__hero--empty">
              <p className="cert-panel__eyebrow">{CERTIFICATION_JOURNEY_COPY.sectionKicker}</p>
              <h3 className="cert-panel__goal-title">Your certification journey</h3>
              <p className="cert-panel__goal-sub">
                Add up to {MAX_CERTIFICATION_ENROLLMENTS} certifications and Compass will shape your week around them.
              </p>
            </div>
            <footer className="cert-panel__footer">
              <button
                type="button"
                className="cert-panel__btn cert-panel__btn--primary cert-panel__btn--compact"
                onClick={() => setPickerOpen(true)}
              >
                {CERTIFICATION_JOURNEY_COPY.addCertification}
              </button>
            </footer>
          </div>
        </article>
        {enrollmentError && (
          <p className="focus-cert-error" role="alert">
            {enrollmentError}
            <button type="button" className="focus-cert-error__dismiss" onClick={onClearError}>Dismiss</button>
          </p>
        )}
        <CertificationPickerModal
          open={pickerOpen}
          catalog={catalog}
          enrolledIds={enrolledIds}
          onClose={() => setPickerOpen(false)}
          onAdd={id => {
            onEnroll(id);
            setPickerOpen(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className="focus-cert-panel-stack">
        {views.map(view => (
          <CertificationPanel
            key={view.certification.certification_id}
            view={view}
            expanded={expandedId === view.certification.certification_id}
            onToggle={() => setExpandedId(
              expandedId === view.certification.certification_id ? null : view.certification.certification_id,
            )}
            onRemove={() => onRemove(view.certification.certification_id)}
          />
        ))}
      </div>

      {enrollmentError && (
        <p className="focus-cert-error" role="alert">
          {enrollmentError}
          <button type="button" className="focus-cert-error__dismiss" onClick={onClearError}>Dismiss</button>
        </p>
      )}

      {enrolledIds.length < MAX_CERTIFICATION_ENROLLMENTS && (
        <div className="focus-cert-panel-stack__add">
          <button
            type="button"
            className="focus-plan-export__btn focus-plan-export__btn--primary"
            onClick={() => setPickerOpen(true)}
          >
            {CERTIFICATION_JOURNEY_COPY.addCertification}
          </button>
        </div>
      )}

      <CertificationPickerModal
        open={pickerOpen}
        catalog={catalog}
        enrolledIds={enrolledIds}
        onClose={() => setPickerOpen(false)}
        onAdd={id => {
          onEnroll(id);
          if (enrolledIds.length + 1 >= MAX_CERTIFICATION_ENROLLMENTS) setPickerOpen(false);
        }}
      />
    </>
  );
}
