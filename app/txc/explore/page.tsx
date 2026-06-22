"use client";
// =============================================================================
// EventCompass — Explore  /txc/explore
// Intent + preview — how Compass helps for each attendee goal.
// =============================================================================
import Link from "next/link";
import { useState } from "react";
import ExploreJourneyPanel from "@/components/explore/ExploreJourneyPanel";
import { EXPLORE_JOURNEYS } from "@/data/exploreJourneys";
import { useAuth } from "@/context/AuthContext";

export default function ExplorePage() {
  const { user, enrolled } = useAuth();
  const [activeId, setActiveId] = useState(EXPLORE_JOURNEYS[0]!.id);
  const activeJourney = EXPLORE_JOURNEYS.find(j => j.id === activeId) ?? EXPLORE_JOURNEYS[0]!;

  return (
    <>
      <section className="story-hero story-hero--strong story-hero--spacious explore-hero">
        <div className="section-kicker">Explore</div>
        <h1>What do you want to accomplish?</h1>
        <p className="explore-hero-lead">
          Pick your intent. See how Compass helps — specific sessions and people unlock after you build your profile.
        </p>
      </section>

      <section className="explore-selector-section no-top-border">
        <div
          className="explore-journey-chips"
          role="tablist"
          aria-label="Journey intents"
        >
          {EXPLORE_JOURNEYS.map(journey => (
            <button
              key={journey.id}
              type="button"
              role="tab"
              id={`explore-journey-tab-${journey.id}`}
              aria-selected={activeId === journey.id}
              aria-controls="explore-journey-panel"
              className={`explore-journey-chip${activeId === journey.id ? " is-active" : ""}`}
              style={{ "--journey-accent": journey.accent } as React.CSSProperties}
              onClick={() => setActiveId(journey.id)}
            >
              {journey.title}
            </button>
          ))}
        </div>

        <div id="explore-journey-panel" role="tabpanel" aria-labelledby={`explore-journey-tab-${activeId}`}>
          <ExploreJourneyPanel journey={activeJourney} enrolled={Boolean(user && enrolled)} />
        </div>
      </section>

      <section className="final-band">
        <div>
          {user && enrolled ? (
            <>
              <h2>Your path is taking shape.</h2>
              <p>Open My Compass to see recommendations matched to your goals.</p>
            </>
          ) : (
            <>
              <h2>Start with your goal.</h2>
              <p>Share what you want to accomplish — Compass builds your experience from there.</p>
            </>
          )}
        </div>
        {user && enrolled ? (
          <Link href="/txc/experience" className="btn-primary">Open My Compass →</Link>
        ) : (
          <Link href="/txc/enroll" className="btn-primary">Build My Compass →</Link>
        )}
      </section>
    </>
  );
}
