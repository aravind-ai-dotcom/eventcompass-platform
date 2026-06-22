"use client";
// =============================================================================
// EventCompass — Home
// Lifetime value: Prepare → Meet → Experience → Continue
// =============================================================================
import Link from "next/link";
import HomeCompassPreview from "@/components/home/HomeCompassPreview";
import HomeLifecycleRotator from "@/components/home/HomeLifecycleRotator";
import HomeProofStrip from "@/components/home/HomeProofStrip";

export default function HomePage() {
  return (
    <>
      <section className="hero-shell hero-shell--home hero-shell--compact hero-shell--with-preview">
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
            <Link href="/txc/enroll" className="btn-primary">Build My Compass</Link>
            <Link href="/txc/explore" className="btn-secondary">How Compass works</Link>
          </div>
        </div>
        <HomeCompassPreview />
      </section>

      <HomeProofStrip />

      <section className="story-section story-section--compact no-top-border">
        <HomeLifecycleRotator />
      </section>

      <section className="final-band">
        <div>
          <h2>Start before you arrive.</h2>
          <p>Tell Compass what matters and walk into TechXchange with a plan.</p>
        </div>
        <Link href="/txc/enroll" className="btn-primary">Build My Compass →</Link>
      </section>
    </>
  );
}
