import Link from "next/link";
import { CERTIFICATION_MILESTONES } from "@/lib/certificationProfile";

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
        <div className="section-kicker">Certification goals</div>
        <h2 className="certification-journey-title">
          Working toward: {certificationLabel}
        </h2>
        <ol className="explore-milestone-path certification-milestone-path" aria-label="Certification pathway">
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
        <Link href="/sessions?type=certification" className="action-chip">
          View certification sessions
        </Link>
      </div>
    </section>
  );
}
