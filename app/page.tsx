"use client";
// =============================================================================
// EventCompass — Home
// Lifetime value: Prepare → Meet → Experience → Continue
// =============================================================================
import Image from "next/image";
import Link from "next/link";

const LIFECYCLE = [
  {
    id: "prepare",
    kicker: "Prepare",
    title: "Shape your goals before you arrive.",
    body: "Tell Compass what matters — learning paths, certification targets, and connection intent.",
    image: "/event/learning-lab.jpg",
    href: "/enroll",
    cta: "Build My Compass",
  },
  {
    id: "meet",
    kicker: "Meet",
    title: "Find your people in the room.",
    body: "Experts, mentors, peers, and community leaders matched to your interests and experience.",
    image: "/event/people-v2.jpg",
    href: "/champions",
    cta: "Explore people",
  },
  {
    id: "experience",
    kicker: "Experience",
    title: "Live TechXchange with clarity.",
    body: "An AI-powered week plan — sessions prioritized, conflicts resolved, every day intentional.",
    image: "/event/community-v2.jpg",
    href: "/experience",
    cta: "Open My Compass",
  },
  {
    id: "continue",
    kicker: "Continue",
    title: "Take it home.",
    body: "Certification progress, connections, and learning paths that extend beyond the event.",
    image: "/event/certification.jpg",
    href: "/explore",
    cta: "See how Compass works",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="hero-shell hero-shell--home hero-shell--compact">
        <div className="hero-copy">
          <span className="eyebrow">IBM TechXchange 2026</span>
          <h1 className="home-hero-title">Your intelligent guide to TechXchange.</h1>
          <p>
            Compass starts before the event and continues after you return home —
            prepare, meet, experience, and continue your momentum.
          </p>
          <div className="hero-actions">
            <Link href="/enroll" className="btn-primary">Build My Compass</Link>
            <Link href="/explore" className="btn-secondary">How Compass works</Link>
          </div>
        </div>
      </section>

      <section className="story-section story-section--compact no-top-border">
        <div className="home-lifecycle-grid">
          {LIFECYCLE.map(phase => (
            <article key={phase.id} className="home-lifecycle-card">
              <div className="home-lifecycle-image">
                <Image
                  src={phase.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="home-lifecycle-body">
                <span className="section-kicker">{phase.kicker}</span>
                <h2 className="home-lifecycle-title">{phase.title}</h2>
                <p>{phase.body}</p>
                <Link href={phase.href} className="action-chip">{phase.cta} →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="final-band">
        <div>
          <h2>Start before you arrive.</h2>
          <p>Tell Compass what matters and walk into TechXchange with a plan.</p>
        </div>
        <Link href="/enroll" className="btn-primary">Build My Compass →</Link>
      </section>
    </>
  );
}
