import Link from "next/link";
import {
  CERTIFICATION_JOURNEY_COPY,
  CERTIFICATION_MILESTONES,
} from "@/lib/certificationProfile";
import type {
  CertificationJourneyPlan,
  JourneyLinkItem,
} from "@/lib/certificationJourneyIntelligence";

interface CertificationJourneyProps {
  visible: boolean;
  plan: CertificationJourneyPlan | null;
  onRemoveAchieve?: () => void;
  accent?: string;
  embedded?: boolean;
}

function JourneyStage({
  label,
  items,
  emptyCopy,
  accent,
  isLast = false,
}: {
  label: string;
  items: JourneyLinkItem[];
  emptyCopy?: string;
  accent: string;
  isLast?: boolean;
}) {
  return (
    <li className="cert-journey-stage">
      <div className="cert-journey-stage-rail" aria-hidden="true">
        <span className="cert-journey-stage-dot" style={{ borderColor: accent, background: accent }} />
        {!isLast && <span className="cert-journey-stage-line" style={{ background: accent }} />}
      </div>
      <div className="cert-journey-stage-body">
        <h3 className="cert-journey-stage-label">{label}</h3>
        {items.length > 0 ? (
          <ul className="cert-journey-item-list">
            {items.map(item => (
              <li key={item.id}>
                <Link href={item.href} className="cert-journey-item-link">
                  <span className="cert-journey-item-title">{item.title}</span>
                  {item.meta && <span className="cert-journey-item-meta">{item.meta}</span>}
                </Link>
              </li>
            ))}
          </ul>
        ) : emptyCopy ? (
          <p className="cert-journey-stage-empty">{emptyCopy}</p>
        ) : null}
      </div>
    </li>
  );
}

export default function CertificationJourney({
  visible,
  plan,
  onRemoveAchieve,
  accent = "#a56eff",
  embedded = false,
}: CertificationJourneyProps) {
  if (!visible || !plan) return null;

  const outerClass = embedded
    ? "compass-module-block certification-journey-section"
    : "section no-top-border certification-journey-section";

  const stages: Array<{ key: string; label: string; items: JourneyLinkItem[]; empty?: string }> = [
    { key: "learn", label: "Learn", items: plan.learn, empty: CERTIFICATION_JOURNEY_COPY.emptyStage },
    { key: "practice", label: "Practice", items: plan.practice, empty: CERTIFICATION_JOURNEY_COPY.emptyStage },
    { key: "connect", label: "Connect", items: plan.connect, empty: "Champions and experts appear here as Compass matches your journey." },
    { key: "community", label: "Community", items: plan.community, empty: "Study groups and meetups surface here from Live Huddles and community sessions." },
  ];

  return (
    <section className={outerClass}>
      <div className="certification-journey-card">
        <div className="section-kicker">{CERTIFICATION_JOURNEY_COPY.sectionKicker}</div>

        <div className="cert-journey-hero">
          <p className="cert-journey-kicker">{CERTIFICATION_JOURNEY_COPY.workingToward}</p>
          <h2 className="certification-journey-title">{plan.shortTitle}</h2>
          <dl className="cert-journey-meta">
            {plan.track && (
              <>
                <dt>Track</dt>
                <dd>{plan.track}</dd>
              </>
            )}
            {plan.product && (
              <>
                <dt>Product</dt>
                <dd>{plan.product}</dd>
              </>
            )}
            {plan.certificationCode && (
              <>
                <dt>Code</dt>
                <dd>{plan.certificationCode}</dd>
              </>
            )}
          </dl>
        </div>

        <div className="cert-journey-summary" aria-label={CERTIFICATION_JOURNEY_COPY.progressSummary}>
          <div className="cert-journey-stat">
            <b>{plan.summary.recommendedSessions}</b>
            <span>{CERTIFICATION_JOURNEY_COPY.recommendedSessions}</span>
          </div>
          <div className="cert-journey-stat">
            <b>{plan.summary.labs}</b>
            <span>{CERTIFICATION_JOURNEY_COPY.labs}</span>
          </div>
          <div className="cert-journey-stat">
            <b>{plan.summary.experts}</b>
            <span>{CERTIFICATION_JOURNEY_COPY.experts}</span>
          </div>
          <div className="cert-journey-stat">
            <b>{plan.summary.studyGroups}</b>
            <span>{CERTIFICATION_JOURNEY_COPY.studyGroups}</span>
          </div>
        </div>

        <ol className="cert-journey-path" aria-label="Certification journey progression">
          <li className="cert-journey-stage cert-journey-stage--anchor">
            <div className="cert-journey-stage-rail" aria-hidden="true">
              <span className="cert-journey-stage-dot cert-journey-stage-dot--outline" style={{ borderColor: accent }} />
              <span className="cert-journey-stage-line" style={{ background: accent }} />
            </div>
            <div className="cert-journey-stage-body">
              <h3 className="cert-journey-stage-label">{CERTIFICATION_MILESTONES[0]}</h3>
              <p className="cert-journey-anchor-copy">{plan.certificationTitle}</p>
            </div>
          </li>

          {stages.map(stage => (
            <JourneyStage
              key={stage.key}
              label={stage.label}
              items={stage.items}
              emptyCopy={stage.empty}
              accent={accent}
              isLast={false}
            />
          ))}

          <li className="cert-journey-stage cert-journey-stage--achieve">
            <div className="cert-journey-stage-rail" aria-hidden="true">
              <span className="cert-journey-stage-dot" style={{ borderColor: accent, background: "var(--surface)" }} />
            </div>
            <div className="cert-journey-stage-body">
              <h3 className="cert-journey-stage-label">{CERTIFICATION_MILESTONES[5]}</h3>
              {plan.achieve && (
                <article className="cert-journey-achieve-card">
                  <p className="cert-journey-achieve-kicker">{CERTIFICATION_JOURNEY_COPY.achieveLabel}</p>
                  <p className="cert-journey-achieve-title">{plan.achieve.title}</p>
                  <p className="cert-journey-achieve-note">{CERTIFICATION_JOURNEY_COPY.achieveNote}</p>
                  <div className="certification-journey-actions">
                    <Link href={plan.achieve.href} className="action-chip">
                      View opportunity
                    </Link>
                    {onRemoveAchieve && (
                      <button type="button" className="action-chip" onClick={onRemoveAchieve}>
                        Remove
                      </button>
                    )}
                  </div>
                </article>
              )}
            </div>
          </li>
        </ol>

        <div className="certification-journey-actions cert-journey-footer-actions">
          <Link href="/txc/sessions?type=certification" className="action-chip">
            {CERTIFICATION_JOURNEY_COPY.exploreCertifications}
          </Link>
          <Link href="/txc/sessions" className="action-chip">
            {CERTIFICATION_JOURNEY_COPY.viewAllSessions}
          </Link>
        </div>
      </div>
    </section>
  );
}
