"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ForgeArtwork from "@/components/media/ForgeArtwork";
import { FORGE_PILLARS } from "@/config/forgeBrand";

const LIFECYCLE_IMAGES = [
  "/forge/hero-crystal-beam.png",
  "/forge/visual-signals.svg",
  "/forge/visual-trajectory.svg",
] as const;

const LIFECYCLE = FORGE_PILLARS.map((pillar, index) => ({
  ...pillar,
  image: LIFECYCLE_IMAGES[index],
}));

const ROTATE_MS = 7000;

export default function HomeLifecycleRotator() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setActive((index + LIFECYCLE.length) % LIFECYCLE.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setActive(prev => (prev + 1) % LIFECYCLE.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused]);

  const phase = LIFECYCLE[active];

  return (
    <div
      className="home-lifecycle-rotator"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="home-lifecycle-rotator-tabs" role="tablist" aria-label="Journey pillars">
        {LIFECYCLE.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`lifecycle-tab-${item.id}`}
            aria-selected={active === index}
            aria-controls="lifecycle-panel"
            className={`home-lifecycle-tab${active === index ? " is-active" : ""}`}
            onClick={() => goTo(index)}
          >
            <span className="home-lifecycle-tab__label">{item.kicker}</span>
            <span className="home-lifecycle-tab__index" aria-hidden="true">{index + 1}</span>
          </button>
        ))}
      </div>
      <div className="home-lifecycle-progress" aria-hidden="true">
        <span
          className="home-lifecycle-progress__fill"
          style={{ width: `${((active + 1) / LIFECYCLE.length) * 100}%` }}
        />
      </div>

      <div
        id="lifecycle-panel"
        role="tabpanel"
        aria-labelledby={`lifecycle-tab-${phase.id}`}
        className="home-lifecycle-rotator-panel"
      >
        <div className="home-lifecycle-rotator-media forge-visual-stage">
          {LIFECYCLE.map((item, index) => (
            <div
              key={item.id}
              className={`home-lifecycle-rotator-slide${active === index ? " is-active" : ""}`}
              aria-hidden={active !== index}
            >
              <ForgeArtwork
                src={item.image}
                className="forge-visual-stage__art"
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        <div className="home-lifecycle-rotator-copy">
          <span className="section-kicker">{phase.kicker}</span>
          <h2 className="home-lifecycle-title">{phase.title}</h2>
          <p>{phase.body}</p>
          <Link href={phase.href} className="action-chip">
            {phase.cta} →
          </Link>
        </div>
      </div>

      <div className="home-lifecycle-rotator-footer">
        <div className="home-lifecycle-dots" aria-hidden="true">
          {LIFECYCLE.map((item, index) => (
            <span
              key={item.id}
              className={`home-lifecycle-dot${active === index ? " is-active" : ""}`}
            />
          ))}
        </div>
        <div className="home-lifecycle-rotator-nav">
          <button
            type="button"
            className="home-lifecycle-nav-btn"
            aria-label="Previous pillar"
            onClick={() => goTo(active - 1)}
          >
            ←
          </button>
          <button
            type="button"
            className="home-lifecycle-nav-btn"
            aria-label="Next pillar"
            onClick={() => goTo(active + 1)}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
