"use client";
// =============================================================================
// EventCompass — Home
// Lifetime value: Prepare → Meet → Experience → Continue
// =============================================================================
import Link from "next/link";
import HomeLifecycleRotator from "@/components/home/HomeLifecycleRotator";

export default function HomePage() {
  return (
    <>
      <section className="hero-shell hero-shell--home hero-shell--compact">
        <div className="hero-copy">
          <span className="eyebrow">IBM TechXchange 2026</span>
          <h1 className="home-hero-title">
            See who is here, what is moving, and where opportunities are forming.
          </h1>
          <p>
            Compass starts before the event and continues after you return home —
            prepare, meet, experience, and continue your momentum.
          </p>
          <div className="hero-actions">
            <Link href="/enroll" className="btn-primary">Build My Compass</Link>
            <Link href="/explore" className="btn-secondary">How Compass works</Link>
          </div>
          <div className="hero-actions hero-actions--secondary">
            <Link href="/sko" className="btn-secondary">Compass SKO →</Link>
            <Link href="/sko/login" className="btn-secondary">SKO seller sign in</Link>
          </div>
        </div>
      </section>

      <section className="story-section story-section--compact no-top-border">
        <HomeLifecycleRotator />
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
