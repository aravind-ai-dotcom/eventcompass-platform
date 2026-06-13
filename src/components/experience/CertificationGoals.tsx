import Link from "next/link";

interface CertificationGoalsProps {
  hasCertificationGoal: boolean;
}

export default function CertificationGoals({ hasCertificationGoal }: CertificationGoalsProps) {
  if (hasCertificationGoal) return null;

  return (
    <section className="section certification-goals-section">
      <div className="certification-goals-card">
        <div className="section-kicker">Certification goals</div>
        <h2 className="certification-goals-title">Working toward a certification?</h2>
        <p className="certification-goals-copy">
          Compass can build a personalized learning plan around your exam — sessions, labs,
          experts, and study moments aligned to your timeline.
        </p>
        <Link href="/explore#journey-certification" className="action-chip">
          Explore certifications
        </Link>
      </div>
    </section>
  );
}
