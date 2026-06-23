"use client";

import Link from "next/link";
import HomeCompassPreview from "@/components/home/HomeCompassPreview";
import HomeLifecycleRotator from "@/components/home/HomeLifecycleRotator";
import HomeProofStrip from "@/components/home/HomeProofStrip";
import { FORGE_EVENT, FORGE_PRODUCT } from "@/config/forgeBrand";

export default function HomePage() {
  return (
    <>
      <section className="hero-shell hero-shell--home hero-shell--compact hero-shell--with-preview">
        <div className="hero-copy">
          <span className="eyebrow">{FORGE_EVENT.name}</span>
          <h1 className="home-hero-title">{FORGE_EVENT.tagline}</h1>
          <p>
            Join thousands of technology leaders, builders, and innovators for four days of
            learning, collaboration, and hands-on experiences.
          </p>
          <p className="hero-meta" style={{ color: "var(--muted)", fontSize: "0.88rem", marginTop: "8px" }}>
            {FORGE_EVENT.dates} · {FORGE_EVENT.locationLine}
          </p>
          <div className="hero-actions">
            <Link href="/txc/enroll" className="btn-primary">{FORGE_PRODUCT.buildMyJourney}</Link>
            <Link href="/txc/sessions" className="btn-secondary">Explore Sessions</Link>
            <Link href="/txc/experience#compass-ai" className="btn-ghost">Ask Compass AI</Link>
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
          <h2>Start with intention.</h2>
          <p>Tell Compass what matters and walk into FORGE with a plan built for you.</p>
        </div>
        <Link href="/txc/enroll" className="btn-primary">{FORGE_PRODUCT.buildMyJourney} →</Link>
      </section>
    </>
  );
}
