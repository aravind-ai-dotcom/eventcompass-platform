import Link from "next/link";
import {
  CERTIFICATION_JOURNEY_COPY,
  CERTIFICATION_MILESTONES,
  type SelectedCertificationGoal,
} from "@/lib/certificationProfile";

interface CertificationJourneyProps {
  visible: boolean;
  certifications: SelectedCertificationGoal[];
  onRemove?: (id: string) => void;
  accent?: string;
}

export default function CertificationJourney({
  visible,
  certifications,
  onRemove,
  accent = "#a56eff",
}: CertificationJourneyProps) {
  if (!visible) return null;

  return (
    <section className="section no-top-border certification-journey-section">
      <div className="certification-journey-card">
        <div className="section-kicker">{CERTIFICATION_JOURNEY_COPY.sectionKicker}</div>
        <h2 className="certification-journey-title">
          {CERTIFICATION_JOURNEY_COPY.workingToward} earn a certification
        </h2>
        <p className="certification-journey-copy">{CERTIFICATION_JOURNEY_COPY.supporting}</p>

        {certifications.length > 0 ? (
          <ul className="certification-goal-list" aria-label="Selected certification goals">
            {certifications.map(cert => (
              <li key={cert.id} className="certification-goal-item">
                <div className="certification-goal-body">
                  <p className="certification-goal-title">{cert.title}</p>
                  {cert.certification_code && (
                    <p className="certification-goal-code">{cert.certification_code}</p>
                  )}
                  <dl className="certification-goal-meta">
                    {cert.products?.[0] && (
                      <>
                        <dt>Product</dt>
                        <dd>{cert.products.join(", ")}</dd>
                      </>
                    )}
                    {cert.track && (
                      <>
                        <dt>Track</dt>
                        <dd>{cert.track}</dd>
                      </>
                    )}
                    {cert.topics?.[0] && (
                      <>
                        <dt>Topic</dt>
                        <dd>{cert.topics.join(", ")}</dd>
                      </>
                    )}
                  </dl>
                  <p className="certification-goal-note">{CERTIFICATION_JOURNEY_COPY.onDemandNote}</p>
                </div>
                {onRemove && (
                  <button
                    type="button"
                    className="action-chip"
                    onClick={() => onRemove(cert.id)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="certification-journey-empty">
            Save certification opportunities from the session catalog to track your learning journey here.
          </p>
        )}

        <ol className="explore-milestone-path certification-milestone-path" aria-label="Certification journey">
          {CERTIFICATION_MILESTONES.map((step, stepIndex) => (
            <li key={step} className="explore-milestone-step">
              <div className="explore-milestone-node">
                <span
                  className="explore-milestone-dot"
                  style={{
                    borderColor: accent,
                    background: stepIndex === 0 ? accent : "var(--surface)",
                  }}
                  aria-hidden="true"
                />
                {stepIndex < CERTIFICATION_MILESTONES.length - 1 && (
                  <span className="explore-milestone-line" style={{ background: accent }} aria-hidden="true" />
                )}
              </div>
              <span className="explore-milestone-label">{step}</span>
            </li>
          ))}
        </ol>

        <ul className="certification-journey-community" aria-label="Community along your journey">
          {CERTIFICATION_JOURNEY_COPY.community.map(line => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <div className="certification-journey-actions">
          <Link href="/sessions?type=certification" className="action-chip">
            {CERTIFICATION_JOURNEY_COPY.exploreCertifications}
          </Link>
        </div>
      </div>
    </section>
  );
}
