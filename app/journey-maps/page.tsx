"use client";
// =============================================================================
// EventCompass — Journey Maps  /journey-maps
// Onboarding, help, and marketing: how Compass helps different attendees succeed.
// =============================================================================
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface Journey {
  id: string;
  title: string;
  goal: string;
  flow: string[];
  accent: string;
}

const JOURNEYS: Journey[] = [
  {
    id: "learning",
    title: "Learning journey",
    goal: "Learn new technology",
    flow: ["Goals", "Sessions", "Labs", "Experts"],
    accent: "#0f62fe",
  },
  {
    id: "certification",
    title: "Certification journey",
    goal: "Pass a certification",
    flow: ["Certification goal", "Preparation", "Readiness", "Exam"],
    accent: "#a56eff",
  },
  {
    id: "networking",
    title: "Networking journey",
    goal: "Meet the right people",
    flow: ["Interests", "Experts", "Connections"],
    accent: "#005d5d",
  },
  {
    id: "community",
    title: "Community journey",
    goal: "Find your people",
    flow: ["Communities", "User groups", "Meetups"],
    accent: "#b45309",
  },
  {
    id: "problem-solver",
    title: "Problem solver journey",
    goal: "Solve a business challenge",
    flow: ["Challenge", "Content", "Experts", "Solution"],
    accent: "#da1e28",
  },
];

export default function JourneyMapsPage() {
  const { user, enrolled } = useAuth();

  return (
    <>
      <section className="story-hero story-hero--strong story-hero--spacious">
        <div className="section-kicker">Journey maps</div>
        <h1>How Compass helps you succeed.</h1>
        <p>
          Every attendee arrives with a different goal. Compass maps your intent
          to the sessions, people, and experiences that matter most — whether you
          are here to learn, certify, connect, or solve.
        </p>
      </section>

      <div className="journey-maps">
        {JOURNEYS.map((journey, i) => (
          <section
            key={journey.id}
            className={`journey-map${i === 0 ? " no-top-border" : ""}`}
            aria-labelledby={`journey-${journey.id}-title`}
          >
            <div className="journey-map-header">
              <span className="narrative-kicker" style={{ color: journey.accent }}>
                {journey.title}
              </span>
              <h2 id={`journey-${journey.id}-title`} className="journey-map-goal">
                Goal: {journey.goal}
              </h2>
            </div>

            <ol className="journey-timeline" aria-label={`${journey.title} flow`}>
              {journey.flow.map((step, stepIndex) => (
                <li key={step} className="journey-timeline-step">
                  <div
                    className="journey-timeline-marker"
                    style={{ borderColor: journey.accent, color: journey.accent }}
                    aria-hidden="true"
                  >
                    {stepIndex + 1}
                  </div>
                  <div className="journey-timeline-content">
                    <span className="journey-timeline-label">{step}</span>
                    {stepIndex < journey.flow.length - 1 && (
                      <span className="journey-timeline-arrow" aria-hidden="true">→</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section className="final-band">
        <div>
          {user && enrolled ? (
            <>
              <h2>Your journey is underway.</h2>
              <p>Open My Experience to see your personalized path taking shape.</p>
            </>
          ) : (
            <>
              <h2>Start your journey.</h2>
              <p>
                Tell Compass what you came to achieve and get a personalized
                TechXchange experience in minutes.
              </p>
            </>
          )}
        </div>
        {user && enrolled ? (
          <Link href="/experience" className="btn-primary">Open My Compass →</Link>
        ) : (
          <Link href="/enroll" className="btn-primary">Build My Compass →</Link>
        )}
      </section>
    </>
  );
}
