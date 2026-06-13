import Link from "next/link";
import {
  CERTIFICATION_JOURNEY_COPY,
  CERTIFICATION_MILESTONES,
} from "@/lib/certificationProfile";

interface CertificationJourneyProps {
  visible: boolean;
  certificationLabel: string | null;
  accent?: string;
}

export default function CertificationJourney({
  visible,
  certificationLabel,
  accent = "#a56eff",
}: CertificationJourneyProps) {
  if (!visible || !certificationLabel) return null;

  return (
    <section className="section certification-journey-section">
      <div className="certification-journey-card">
        <div className="section-kicker">{CERTIFICATION_JOURNEY_COPY.sectionKicker}</div>
        <h2 className="certification-journey-title">
          {CERTIFICATION_JOURNEY_COPY.workingToward} {certificationLabel}
        </h2>
        <p className="certification-journey-copy">{CERTIFICATION_JOURNEY_COPY.supporting}</p>

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
            {CERTIFICATION_JOURNEY_COPY.viewSupporting}
          </Link>
          <Link href="/sessions?view=learning-paths" className="action-chip">
            {CERTIFICATION_JOURNEY_COPY.viewPaths}
          </Link>
        </div>
      </div>
    </section>
  );
}
