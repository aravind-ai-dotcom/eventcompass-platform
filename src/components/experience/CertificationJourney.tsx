"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CERTIFICATION_JOURNEY_COPY,
  CERTIFICATION_MILESTONES,
  type SelectedCertificationGoal,
} from "@/lib/certificationProfile";
import type {
  CertificationJourneyPlan,
  JourneyLinkItem,
} from "@/lib/certificationJourneyIntelligence";
import type { CertificationStage } from "@/types/certificationTracker";
import AddCertificationModal from "@/components/experience/AddCertificationModal";
import type { CertificationJourneyRecord } from "@/types/certificationSession";

interface CertificationJourneyProps {
  visible: boolean;
  plan: CertificationJourneyPlan | null;
  trackedCerts: SelectedCertificationGoal[];
  activeCertId: string | null;
  hasExplicitGoals: boolean;
  onAddCertification: (cert: CertificationJourneyRecord) => void;
  onSelectCertification: (certId: string) => void;
  onRemoveCertification: (certId: string) => void;
  onPinToStage: (stage: CertificationStage, item: JourneyLinkItem) => void;
  onRemoveFromStage: (stage: CertificationStage, itemId: string) => void;
  onAddCustomLink: (link: { title: string; url: string }) => void;
  embedded?: boolean;
}

function StageTile({
  label,
  items,
  emptyCopy,
  variant = "default",
  stage,
  available = [],
  onPin,
  onRemove,
}: {
  label: string;
  items: JourneyLinkItem[];
  emptyCopy?: string;
  variant?: "default" | "anchor" | "achieve";
  stage?: CertificationStage;
  available?: JourneyLinkItem[];
  onPin?: (item: JourneyLinkItem) => void;
  onRemove?: (itemId: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <article className={`cert-panel__tile cert-panel__tile--${variant}`}>
      <header className="cert-panel__tile-head">
        <span className="cert-panel__tile-index" aria-hidden="true" />
        <h3 className="cert-panel__tile-label">{label}</h3>
        {stage && onPin && available.length > 0 && (
          <div className="cert-panel__tile-add">
            <button
              type="button"
              className="cert-panel__tile-add-btn"
              onClick={() => setPickerOpen(v => !v)}
              aria-expanded={pickerOpen}
            >
              {CERTIFICATION_JOURNEY_COPY.addResource}
            </button>
            {pickerOpen && (
              <ul className="cert-panel__picker">
                {available.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="cert-panel__picker-item"
                      onClick={() => {
                        onPin(item);
                        setPickerOpen(false);
                      }}
                    >
                      <span>{item.title}</span>
                      {item.meta && <small>{item.meta}</small>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
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
                {onRemove && (
                  <button
                    type="button"
                    className="cert-panel__link-remove"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Remove ${item.title}`}
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : emptyCopy ? (
          <p className="cert-panel__empty">{emptyCopy}</p>
        ) : null}
      </div>
    </article>
  );
}

export default function CertificationJourney({
  visible,
  plan,
  trackedCerts,
  activeCertId,
  hasExplicitGoals,
  onAddCertification,
  onSelectCertification,
  onRemoveCertification,
  onPinToStage,
  onRemoveFromStage,
  onAddCustomLink,
  embedded = false,
}: CertificationJourneyProps) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  if (!visible) return null;

  const wrapperClass = embedded
    ? "compass-module-block certification-journey-section"
    : "section no-top-border certification-journey-section";

  const savedCertIds = trackedCerts.map(c => c.id);

  if (!plan || !hasExplicitGoals) {
    return (
      <div className={wrapperClass}>
        <article className="cert-panel cert-panel--empty" aria-labelledby="cert-journey-empty-heading">
          <div className="cert-panel__rail" aria-hidden="true" />
          <div className="cert-panel__main">
            <div className="cert-panel__hero cert-panel__hero--empty">
              <p className="cert-panel__eyebrow">{CERTIFICATION_JOURNEY_COPY.sectionKicker}</p>
              <h2 id="cert-journey-empty-heading" className="cert-panel__goal-title">
                My Goals
              </h2>
              <p className="cert-panel__goal-sub">{CERTIFICATION_JOURNEY_COPY.emptyJourney}</p>
              <div className="cert-panel__footer cert-panel__footer--inline">
                <button
                  type="button"
                  className="cert-panel__btn cert-panel__btn--primary"
                  onClick={() => setCatalogOpen(true)}
                >
                  {CERTIFICATION_JOURNEY_COPY.addCertification}
                </button>
                <Link href="/txc/sessions?view=learning-paths" className="cert-panel__btn">
                  {CERTIFICATION_JOURNEY_COPY.exploreCertifications}
                </Link>
              </div>
            </div>
          </div>
        </article>
        <AddCertificationModal
          open={catalogOpen}
          savedCertIds={savedCertIds}
          onClose={() => setCatalogOpen(false)}
          onAdd={cert => {
            onAddCertification(cert);
            setCatalogOpen(false);
          }}
        />
      </div>
    );
  }

  const metaTags = [
    plan.track && { label: "Track", value: plan.track },
    plan.product && { label: "Product", value: plan.product },
    plan.certificationCode && { label: "Code", value: plan.certificationCode },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const handleAddLink = () => {
    const title = linkTitle.trim();
    const url = linkUrl.trim();
    if (!title || !url) return;
    onAddCustomLink({ title, url });
    setLinkTitle("");
    setLinkUrl("");
  };

  return (
    <div className={wrapperClass}>
      <article className="cert-panel" aria-labelledby="cert-journey-heading">
        <div className="cert-panel__rail" aria-hidden="true" />

        <div className="cert-panel__main">
          <header className="cert-panel__hero">
            <div className="cert-panel__hero-top">
              <p className="cert-panel__eyebrow">{CERTIFICATION_JOURNEY_COPY.sectionKicker}</p>
              <div className="cert-panel__hero-actions">
                <button
                  type="button"
                  className="cert-panel__btn cert-panel__btn--ghost"
                  onClick={() => setCatalogOpen(true)}
                >
                  {CERTIFICATION_JOURNEY_COPY.addCertification}
                </button>
                {activeCertId && (
                  <button
                    type="button"
                    className="cert-panel__btn"
                    onClick={() => onRemoveCertification(activeCertId)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {trackedCerts.length > 1 && (
              <div className="cert-panel__tabs" role="tablist" aria-label="Tracked certifications">
                {trackedCerts.map(cert => (
                  <button
                    key={cert.id}
                    type="button"
                    role="tab"
                    aria-selected={cert.id === activeCertId}
                    className={`cert-panel__tab${cert.id === activeCertId ? " cert-panel__tab--active" : ""}`}
                    onClick={() => onSelectCertification(cert.id)}
                  >
                    {cert.certification_code ?? cert.title.split(/–|—/).pop()?.trim() ?? cert.title}
                  </button>
                ))}
              </div>
            )}

            <div className="cert-panel__hero-row">
              <div className="cert-panel__goal">
                <p className="cert-panel__goal-kicker">{CERTIFICATION_JOURNEY_COPY.workingToward}</p>
                <h2 id="cert-journey-heading" className="cert-panel__goal-title">
                  {plan.shortTitle}
                </h2>
                <p className="cert-panel__goal-sub">{plan.certificationTitle}</p>
              </div>
              {metaTags.length > 0 && (
                <dl className="cert-panel__meta">
                  {metaTags.map(tag => (
                    <div key={tag.label} className="cert-panel__meta-item">
                      <dt>{tag.label}</dt>
                      <dd>{tag.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </header>

          {(plan.knowledge.skills.length > 0 ||
            plan.knowledge.background.length > 0 ||
            plan.knowledge.guideUrl ||
            plan.knowledge.certUrl) && (
            <section className="cert-panel__knowledge" aria-label={CERTIFICATION_JOURNEY_COPY.knowledgeLabel}>
              <h3 className="cert-panel__knowledge-title">{CERTIFICATION_JOURNEY_COPY.knowledgeLabel}</h3>
              {plan.knowledge.description && (
                <p className="cert-panel__knowledge-lead">{plan.knowledge.description}</p>
              )}
              <div className="cert-panel__knowledge-grid">
                {plan.knowledge.skills.length > 0 && (
                  <div className="cert-panel__knowledge-block">
                    <p className="cert-panel__knowledge-label">Skills measured</p>
                    <ul className="cert-panel__knowledge-list">
                      {plan.knowledge.skills.map(s => <li key={s}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {plan.knowledge.background.length > 0 && (
                  <div className="cert-panel__knowledge-block">
                    <p className="cert-panel__knowledge-label">Recommended background</p>
                    <ul className="cert-panel__knowledge-list">
                      {plan.knowledge.background.map(b => <li key={b}>{b}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              <div className="cert-panel__knowledge-links">
                {plan.knowledge.guideUrl && (
                  <a href={plan.knowledge.guideUrl} target="_blank" rel="noopener noreferrer" className="cert-panel__btn">
                    Official guide ↗
                  </a>
                )}
                {plan.knowledge.certUrl && (
                  <a href={plan.knowledge.certUrl} target="_blank" rel="noopener noreferrer" className="cert-panel__btn">
                    Learning resources ↗
                  </a>
                )}
                {plan.knowledge.preparationHours != null && (
                  <span className="cert-panel__knowledge-hours">
                    ~{plan.knowledge.preparationHours} hours preparation
                  </span>
                )}
              </div>
            </section>
          )}

          <div
            className="cert-panel__stats"
            role="group"
            aria-label={CERTIFICATION_JOURNEY_COPY.progressSummary}
          >
            <div className="cert-panel__stat">
              <span className="cert-panel__stat-value">{plan.summary.recommendedSessions}</span>
              <span className="cert-panel__stat-label">{CERTIFICATION_JOURNEY_COPY.recommendedSessions}</span>
            </div>
            <div className="cert-panel__stat">
              <span className="cert-panel__stat-value">{plan.summary.labs}</span>
              <span className="cert-panel__stat-label">{CERTIFICATION_JOURNEY_COPY.labs}</span>
            </div>
            <div className="cert-panel__stat">
              <span className="cert-panel__stat-value">{plan.summary.experts}</span>
              <span className="cert-panel__stat-label">{CERTIFICATION_JOURNEY_COPY.experts}</span>
            </div>
            <div className="cert-panel__stat">
              <span className="cert-panel__stat-value">{plan.summary.studyGroups}</span>
              <span className="cert-panel__stat-label">{CERTIFICATION_JOURNEY_COPY.studyGroups}</span>
            </div>
          </div>

          <div className="cert-panel__grid">
            <StageTile
              label={CERTIFICATION_MILESTONES[0]}
              items={[]}
              emptyCopy={plan.certificationTitle}
              variant="anchor"
            />
            <StageTile
              label={CERTIFICATION_MILESTONES[1]}
              items={plan.learn}
              emptyCopy={CERTIFICATION_JOURNEY_COPY.emptyStage}
              stage="learn"
              available={plan.availableByStage.learn}
              onPin={item => onPinToStage("learn", item)}
              onRemove={id => onRemoveFromStage("learn", id)}
            />
            <StageTile
              label={CERTIFICATION_MILESTONES[2]}
              items={plan.practice}
              emptyCopy={CERTIFICATION_JOURNEY_COPY.emptyStage}
              stage="practice"
              available={plan.availableByStage.practice}
              onPin={item => onPinToStage("practice", item)}
              onRemove={id => onRemoveFromStage("practice", id)}
            />
            <StageTile
              label={CERTIFICATION_MILESTONES[3]}
              items={plan.connect}
              emptyCopy="Add experts from recommendations or guides."
              stage="connect"
              available={plan.availableByStage.connect}
              onPin={item => onPinToStage("connect", item)}
              onRemove={id => onRemoveFromStage("connect", id)}
            />
            <StageTile
              label={CERTIFICATION_MILESTONES[4]}
              items={plan.community}
              emptyCopy="Study groups and meetups appear as Compass matches your journey."
              stage="community"
              available={plan.availableByStage.community}
              onPin={item => onPinToStage("community", item)}
              onRemove={id => onRemoveFromStage("community", id)}
            />

            {plan.achieve && (
              <article className="cert-panel__tile cert-panel__tile--achieve cert-panel__tile--span">
                <header className="cert-panel__tile-head">
                  <span className="cert-panel__tile-index" aria-hidden="true" />
                  <h3 className="cert-panel__tile-label">{CERTIFICATION_MILESTONES[5]}</h3>
                </header>
                <div className="cert-panel__tile-body">
                  <p className="cert-panel__achieve-kicker">{CERTIFICATION_JOURNEY_COPY.achieveLabel}</p>
                  <p className="cert-panel__achieve-title">{plan.achieve.title}</p>
                  <p className="cert-panel__achieve-note">{CERTIFICATION_JOURNEY_COPY.achieveNote}</p>
                  <div className="cert-panel__achieve-actions">
                    <Link href={plan.achieve.href} className="cert-panel__btn cert-panel__btn--primary">
                      View opportunity
                    </Link>
                  </div>
                </div>
              </article>
            )}
          </div>

          <section className="cert-panel__custom-links" aria-label={CERTIFICATION_JOURNEY_COPY.resourcesLabel}>
            <h3 className="cert-panel__knowledge-title">{CERTIFICATION_JOURNEY_COPY.addLink}</h3>
            <div className="cert-panel__link-form">
              <input
                type="text"
                value={linkTitle}
                onChange={e => setLinkTitle(e.target.value)}
                placeholder="Resource title"
                aria-label="Resource title"
              />
              <input
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://"
                aria-label="Resource URL"
              />
              <button type="button" className="cert-panel__btn cert-panel__btn--primary" onClick={handleAddLink}>
                Add
              </button>
            </div>
          </section>

          <footer className="cert-panel__footer">
            <Link href="/txc/sessions?view=learning-paths" className="cert-panel__btn cert-panel__btn--primary">
              {CERTIFICATION_JOURNEY_COPY.exploreCertifications}
            </Link>
            <Link href="/txc/sessions" className="cert-panel__btn">
              {CERTIFICATION_JOURNEY_COPY.viewAllSessions}
            </Link>
          </footer>
        </div>
      </article>

      <AddCertificationModal
        open={catalogOpen}
        savedCertIds={savedCertIds}
        onClose={() => setCatalogOpen(false)}
        onAdd={cert => {
          onAddCertification(cert);
          setCatalogOpen(false);
        }}
      />
    </div>
  );
}
