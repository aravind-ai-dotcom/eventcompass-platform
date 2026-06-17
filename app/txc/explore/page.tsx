"use client";
// =============================================================================
// EventCompass — Explore  /explore
// How Compass helps you succeed — milestone pathways with photography.
// =============================================================================
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface Journey {
  id: string;
  title: string;
  goal: string;
  image: string;
  flow: string[];
  accent: string;
  summary?: string | string[];
  closing?: string;
  href?: string;
  accessLabel?: string;
}

const JOURNEYS: Journey[] = [
  {
    id: "learning",
    title: "Learning",
    goal: "Learn new technology",
    image: "/event/ibm_txc_banner_1.jpg",
    flow: ["Set a goal", "Learn", "Practice", "Connect", "Apply"],
    accent: "#0f62fe",
  },
  {
    id: "certification",
    title: "Certification journey",
    goal: "Deepen skills and achieve certification",
    image: "/event/ibm_txc_banner_4.jpg",
    flow: ["Choose", "Learn", "Practice", "Connect", "Achieve"],
    accent: "#a56eff",
  },
  {
    id: "networking",
    title: "Networking",
    goal: "Find your people",
    image: "/event/ibm_txc_banner_5.jpg",
    flow: ["Discover", "Connect", "Meet", "Share", "Grow"],
    accent: "#005d5d",
  },
  {
    id: "community",
    title: "Community",
    goal: "Build community",
    image: "/event/community-v2.jpg",
    flow: ["Explore", "Join", "Participate", "Contribute", "Belong"],
    accent: "#b45309",
  },
  {
    id: "champions",
    title: "Champions",
    goal: "",
    image: "/event/ibm-champion-journey.png",
    flow: ["Learn", "Connect", "Contribute", "Inspire"],
    accent: "#0f62fe",
    closing:
      "Your experience is more than a schedule. It is the opportunity to leave the community stronger than you found it.",
    href: "/champions",
    accessLabel: "Meet Champions",
  },
  {
    id: "problem-solving",
    title: "Problem solving",
    goal: "Solve a challenge",
    image: "/event/expo.jpg",
    flow: ["Define", "Learn", "Discuss", "Refine", "Deliver"],
    accent: "#da1e28",
  },
];

export default function ExplorePage() {
  const { user, enrolled } = useAuth();

  return (
    <>
      <section className="story-hero story-hero--strong story-hero--spacious">
        <div className="section-kicker">How Compass works</div>
        <h1>How Compass helps you succeed.</h1>
        <p>
          Six paths through TechXchange — each mapped to sessions, people, and
          outcomes aligned to what you came to achieve.
        </p>
      </section>

      <div className="explore-journeys">
        {JOURNEYS.map((journey, i) => (
          <section
            key={journey.id}
            className={`explore-journey${i === 0 ? " no-top-border" : ""}`}
            aria-labelledby={`journey-${journey.id}`}
          >
            <div className="explore-journey-image">
              <Image
                src={journey.image}
                alt={journey.id === "champions" ? "IBM Champions connecting at TechXchange" : ""}
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="explore-journey-body">
              <span className="narrative-kicker" style={{ color: journey.accent }}>
                {journey.title}
              </span>
              {journey.goal ? (
                <h2 id={`journey-${journey.id}`} className="explore-journey-goal">
                  {journey.goal}
                </h2>
              ) : (
                <h2 id={`journey-${journey.id}`} className="sr-only">{journey.title}</h2>
              )}
              {journey.summary && (
                <div className="explore-journey-narrative">
                  {(Array.isArray(journey.summary) ? journey.summary : [journey.summary]).map((paragraph) => (
                    <p key={paragraph} className="explore-journey-summary">{paragraph}</p>
                  ))}
                </div>
              )}
              <ol className="explore-milestone-path" aria-label={`${journey.title} pathway`}>
                {journey.flow.map((step, stepIndex) => (
                  <li key={step} className="explore-milestone-step">
                    <div className="explore-milestone-node">
                      <span
                        className="explore-milestone-dot"
                        style={{ borderColor: journey.accent, background: stepIndex === 0 ? journey.accent : "var(--surface)" }}
                        aria-hidden="true"
                      />
                      {stepIndex < journey.flow.length - 1 && (
                        <span className="explore-milestone-line" style={{ background: journey.accent }} aria-hidden="true" />
                      )}
                    </div>
                    <span className="explore-milestone-label">{step}</span>
                  </li>
                ))}
              </ol>
              {journey.href && journey.accessLabel && (
                <div className="explore-journey-foot">
                  <Link href={journey.href} className="explore-journey-access">
                    {journey.accessLabel} →
                  </Link>
                  {journey.closing && (
                    <p className="explore-journey-footnote">{journey.closing}</p>
                  )}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      <section className="final-band">
        <div>
          {user && enrolled ? (
            <>
              <h2>Your journey is underway.</h2>
              <p>Open My Compass to see your personalized path taking shape.</p>
            </>
          ) : (
            <>
              <h2>Start your journey.</h2>
              <p>Tell Compass what you came to achieve and build your TechXchange experience.</p>
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
