"use client";
// =============================================================================
// EventCompass — Explore  /txc/explore
// Outcome-first journey pathways — goal → how Compass helps → success.
// =============================================================================
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface Journey {
  id: string;
  title: string;
  image: string;
  /** Short step labels (1–3 words) for clean milestone alignment */
  flow: string[];
  accent: string;
  summary: string;
  href?: string;
  accessLabel?: string;
}

const JOURNEYS: Journey[] = [
  {
    id: "certification",
    title: "Earn a certification",
    image: "/event/ibm_txc_banner_4.jpg",
    flow: ["Choose", "Learn", "Experts", "Prepare", "Achieve"],
    accent: "#a56eff",
    summary:
      "Learning paths, labs, experts, and study groups aligned to your certification goal.",
  },
  {
    id: "experts",
    title: "Meet the right experts",
    image: "/event/ibm_txc_banner_1.jpg",
    flow: ["Share", "Discover", "Connect", "Build", "Learn"],
    accent: "#0f62fe",
    summary:
      "Speakers, Champions, mentors, and practitioners matched to your interests.",
  },
  {
    id: "networking",
    title: "Build meaningful connections",
    image: "/event/ibm_txc_banner_5.jpg",
    flow: ["Share", "Match", "Meet", "Connect", "Stay"],
    accent: "#005d5d",
    summary:
      "Alumni, former colleagues, communities, and people worth meeting.",
  },
  {
    id: "challenge",
    title: "Bring a challenge",
    image: "/event/expo.jpg",
    flow: ["Define", "Explore", "Meet", "Gather", "Solve"],
    accent: "#da1e28",
    summary:
      "Sessions, experts, communities, and peer discussions to move you forward.",
  },
  {
    id: "technology",
    title: "Discover what's next",
    image: "/event/community-v2.jpg",
    flow: ["Explore", "Learn", "Practice", "Meet", "Expand"],
    accent: "#b45309",
    summary:
      "Emerging technologies, hands-on experiences, and communities for your interests.",
  },
  {
    id: "champions",
    title: "Inspire and connect",
    image: "/event/ibm-champion-journey.png",
    flow: ["Share", "Meet", "Guide", "Connect", "Grow"],
    accent: "#0f62fe",
    summary:
      "People who benefit from your knowledge, guidance, and experience.",
    href: "/txc/champions",
    accessLabel: "Meet Champions",
  },
];

export default function ExplorePage() {
  const { user, enrolled } = useAuth();

  return (
    <>
      <section className="story-hero story-hero--strong story-hero--spacious explore-hero">
        <div className="section-kicker">Explore</div>
        <h1>What do you want to accomplish?</h1>
        <p className="explore-hero-lead">
          Pick a path. See how Compass connects you to the people and experiences that get you there.
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
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="explore-journey-body">
              <h2 id={`journey-${journey.id}`} className="explore-journey-title">
                {journey.title}
              </h2>
              <p className="explore-journey-summary">{journey.summary}</p>
              <ol
                className="explore-journey-steps"
                aria-label={`${journey.title} steps`}
              >
                {journey.flow.map((step, stepIndex) => (
                  <li
                    key={step}
                    className="explore-journey-step"
                    style={{ "--step-accent": journey.accent } as React.CSSProperties}
                  >
                    <span
                      className={`explore-journey-step__dot${stepIndex === 0 ? " explore-journey-step__dot--active" : ""}`}
                      aria-hidden="true"
                    />
                    <span className="explore-journey-step__num" aria-hidden="true">
                      {stepIndex + 1}
                    </span>
                    <span className="explore-journey-step__label">{step}</span>
                  </li>
                ))}
              </ol>
              {journey.href && journey.accessLabel && (
                <div className="explore-journey-foot">
                  <Link href={journey.href} className="explore-journey-access">
                    {journey.accessLabel} →
                  </Link>
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
