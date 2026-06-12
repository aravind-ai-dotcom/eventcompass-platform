"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
    image: "/event/ibm_txc_banner_B.jpg",
    href: "/experience",
    cta: "Open My Compass",
  },
  {
    id: "continue",
    kicker: "Continue",
    title: "Take it home.",
    body: "Certification progress, connections, and learning paths that extend beyond the event.",
    image: "/event/ibm_txc_banner_A.jpg",
    href: "/explore",
    cta: "See how Compass works",
  },
] as const;

const ROTATE_MS = 7000;

export default function HomeLifecycleRotator() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setActive((index + LIFECYCLE.length) % LIFECYCLE.length);
  }, []);

  useEffect(() => {
    if (paused) return;
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
      <div className="home-lifecycle-rotator-tabs" role="tablist" aria-label="Compass lifecycle">
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
            {item.kicker}
          </button>
        ))}
      </div>

      <div
        id="lifecycle-panel"
        role="tabpanel"
        aria-labelledby={`lifecycle-tab-${phase.id}`}
        className="home-lifecycle-rotator-panel"
      >
        <div className="home-lifecycle-rotator-media">
          {LIFECYCLE.map((item, index) => (
            <div
              key={item.id}
              className={`home-lifecycle-rotator-slide${active === index ? " is-active" : ""}`}
              aria-hidden={active !== index}
            >
              <Image
                src={item.image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                style={{ objectFit: "cover", objectPosition: "center" }}
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
            aria-label="Previous phase"
            onClick={() => goTo(active - 1)}
          >
            ←
          </button>
          <button
            type="button"
            className="home-lifecycle-nav-btn"
            aria-label="Next phase"
            onClick={() => goTo(active + 1)}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
