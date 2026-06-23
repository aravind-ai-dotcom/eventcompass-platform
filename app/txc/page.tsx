"use client";

import Link from "next/link";
import ForgeHeroVisual from "@/components/home/ForgeHeroVisual";
import HomeCompassPreview from "@/components/home/HomeCompassPreview";
import HomeLifecycleRotator from "@/components/home/HomeLifecycleRotator";
import HomeProofStrip from "@/components/home/HomeProofStrip";
import { FORGE_EVENT, FORGE_PRODUCT } from "@/config/forgeBrand";

export default function HomePage() {
  return (
    <>
      <section className="forge-hero forge-hero--with-preview">
        <div className="forge-hero__copy">
          <span className="forge-kicker">{FORGE_EVENT.name}</span>
          <h1 className="forge-hero-title" aria-label={`${FORGE_EVENT.name} — ${FORGE_EVENT.tagline}`}>
            <span className="forge-hero-title__brand">FORGE</span>
            <span className="forge-hero-title__year">2027</span>
          </h1>
          <p className="forge-hero-tagline">{FORGE_EVENT.tagline}</p>
          <p className="forge-hero__lede">
            The builders&apos; destination. An intelligent event system that guides every attendee —
            technology, people, and opportunity aligned by Compass.
          </p>
          <p className="forge-hero-meta">
            {FORGE_EVENT.dates} · {FORGE_EVENT.locationLine}
          </p>
          <div className="forge-hero-actions">
            <Link href="/txc/enroll" className="btn-primary">{FORGE_PRODUCT.buildMyJourney} →</Link>
            <Link href="/txc/sessions" className="btn-secondary">Explore Sessions</Link>
            <Link href="/txc/experience#compass-ai" className="btn-ghost">{FORGE_PRODUCT.askCompassAi}</Link>
          </div>
        </div>
        <ForgeHeroVisual />
      </section>

      <HomeProofStrip />

      <section className="story-section story-section--compact no-top-border">
        <HomeLifecycleRotator />
      </section>

      <section className="forge-panel" style={{ padding: "1.25rem", marginBottom: "2rem" }}>
        <HomeCompassPreview />
      </section>

      <section className="final-band forge-card">
        <div>
          <h2>Your week, engineered.</h2>
          <p>Tell Compass what you&apos;re building. Walk into FORGE with a plan shaped for you.</p>
        </div>
        <Link href="/txc/enroll" className="btn-primary">{FORGE_PRODUCT.buildMyJourney} →</Link>
      </section>
    </>
  );
}
