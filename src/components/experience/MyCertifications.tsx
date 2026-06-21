"use client";

import { useState } from "react";
import Link from "next/link";
import CertificationPickerModal from "@/components/experience/CertificationPickerModal";
import type { TxCertification } from "@/data/certifications";
import { MAX_CERTIFICATION_ENROLLMENTS } from "@/data/certifications";
import type { EnrolledCertificationView } from "@/lib/certificationMatching";

interface MyCertificationsProps {
  views: EnrolledCertificationView[];
  catalog: TxCertification[];
  enrolledIds: string[];
  onEnroll: (certificationId: string) => void;
  onRemove: (certificationId: string) => void;
}

function CertificationCard({
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

  return (
    <article className="focus-cert-card">
      <div className="focus-cert-card__head">
        <div>
          <h3 className="focus-cert-card__title">{certification.title}</h3>
          <p className="focus-cert-card__meta">
            {certification.product} · {certification.level}
          </p>
        </div>
        <p className="focus-cert-card__readiness">Readiness {readiness}%</p>
      </div>

      <p className="focus-cert-card__counts">
        {sessionCount} sessions · {peopleCount} people · {communityCount} communities
      </p>
      <p className="focus-cert-card__reason">{reasonLine}</p>

      <div className="focus-cert-card__actions">
        <a
          href={certification.certification_url}
          target="_blank"
          rel="noopener noreferrer"
          className="action-chip action-chip--quiet"
        >
          View certification
        </a>
        <button type="button" className="action-chip action-chip--quiet" onClick={onToggle}>
          {expanded ? "Hide plan" : "Explore plan"}
        </button>
        <button type="button" className="action-chip action-chip--quiet" onClick={onRemove}>
          Remove
        </button>
      </div>

      {expanded && (
        <div className="focus-cert-card__expanded">
          {view.supportingSessions.length > 0 && (
            <div className="focus-cert-card__section">
              <p className="focus-cert-card__section-label">Supporting sessions</p>
              <ul className="focus-cert-card__list">
                {view.supportingSessions.map(session => (
                  <li key={session.id}>
                    <Link href="/txc/sessions">{session.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {view.supportingPeople.length > 0 && (
            <div className="focus-cert-card__section">
              <p className="focus-cert-card__section-label">People who can help</p>
              <ul className="focus-cert-card__list">
                {view.supportingPeople.map(person => (
                  <li key={person.id}>{person.display_name}</li>
                ))}
              </ul>
            </div>
          )}
          {view.supportingCommunities.length > 0 && (
            <div className="focus-cert-card__section">
              <p className="focus-cert-card__section-label">Communities</p>
              <ul className="focus-cert-card__list">
                {view.supportingCommunities.map(community => (
                  <li key={community.community_id}>{community.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function MyCertifications({
  views,
  catalog,
  enrolledIds,
  onEnroll,
  onRemove,
}: MyCertificationsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (views.length === 0) {
    return (
      <>
        <div className="focus-cert-empty">
          <p className="focus-cert-empty__text">
            Add up to {MAX_CERTIFICATION_ENROLLMENTS} certifications and Compass will shape your week around them.
          </p>
          <button type="button" className="action-chip" onClick={() => setPickerOpen(true)}>
            Add certification
          </button>
        </div>
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
      <div className="focus-cert-stack">
        {views.map(view => (
          <CertificationCard
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

      {enrolledIds.length < MAX_CERTIFICATION_ENROLLMENTS && (
        <button type="button" className="focus-cert-add-more action-chip" onClick={() => setPickerOpen(true)}>
          Add certification
        </button>
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
