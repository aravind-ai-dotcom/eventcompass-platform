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
      <section className="forge-hero forge-hero--visual">
        <div className="forge-hero__beams" aria-hidden="true">
          <span className="forge-beam" style={{ left: "8%", top: 0, height: "100%", opacity: 0.2 }} />
          <span className="forge-beam" style={{ left: "92%", top: 0, height: "100%", opacity: 0.15 }} />
        </div>
        <div className="forge-hero__copy">
          <p className="forge-hero-eyebrow">
            <span className="forge-hero-meta__dates">{FORGE_EVENT.dates}</span>
            <span className="forge-hero-eyebrow__sep" aria-hidden="true">·</span>
            <span>{FORGE_EVENT.city}</span>
          </p>
          <h1 className="forge-hero-title" aria-label={FORGE_PRODUCT.tagline}>
            <span className="forge-hero-title__brand forge-wordmark">{FORGE_PRODUCT.name}</span>
          </h1>
          <p className="forge-hero-tagline">{FORGE_PRODUCT.tagline}</p>
          <p className="forge-hero__lede">
            {FORGE_EVENT.shortName} is IBM&apos;s strategic attendee experience — what to learn,
            who to meet, and how to stay involved before, during, and after the conference.
          </p>
          <div className="forge-hero-meta forge-hero-meta--venue">
            <span>{FORGE_EVENT.venue}</span>
          </div>
          <div className="forge-hero-actions">
            <Link href="/txc/enroll" className="btn-primary">{FORGE_PRODUCT.buildMyJourney}</Link>
            <Link href="/txc/sessions" className="btn-secondary">Explore sessions</Link>
            <Link href="/txc/experience#compass-ai" className="btn-ghost">{FORGE_PRODUCT.askCompassAi}</Link>
          </div>
        </div>
        <ForgeHeroVisual />
      </section>

      <HomeProofStrip />

      <section className="story-section story-section--compact no-top-border">
        <HomeLifecycleRotator />
      </section>

      <section className="forge-panel forge-laser" style={{ padding: "1.25rem", marginBottom: "2rem" }}>
        <HomeCompassPreview />
      </section>

      <section className="final-band forge-card">
        <div>
          <h2>Plan with purpose.</h2>
          <p>
            Compass helps you answer what to learn, who to meet, and how to stay involved —
            from registration through IBM Community long after Las Vegas.
          </p>
        </div>
        <Link href="/txc/enroll" className="btn-primary">{FORGE_PRODUCT.buildMyJourney} →</Link>
      </section>
    </>
  );
}
