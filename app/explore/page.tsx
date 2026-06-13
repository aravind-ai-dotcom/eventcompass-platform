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
}

const JOURNEYS: Journey[] = [
  {
    id: "learning",
    title: "Learning",
    goal: "Learn new technology",
    image: "/event/ibm_txc_banner_1.jpg",
    flow: ["Arrive with a goal", "Follow sessions", "Try it in a lab", "Meet experts", "Build confidence"],
    accent: "#0f62fe",
  },
  {
    id: "certification",
    title: "Certification",
    goal: "Pass a certification",
    image: "/event/ibm_txc_banner_4.jpg",
    flow: ["Choose a certification goal", "Compass builds your plan", "Attend curated sessions", "Gain readiness with SMEs and mentors", "Take the exam"],
    accent: "#a56eff",
  },
  {
    id: "networking",
    title: "Networking",
    goal: "Find your people",
    image: "/event/ibm_txc_banner_5.jpg",
    flow: ["Share your interests", "Find experts and peers", "Make the connection", "Build meaningful relationships"],
    accent: "#005d5d",
  },
  {
    id: "community",
    title: "Community",
    goal: "Find your community",
    image: "/event/community-v2.jpg",
    flow: ["Identify communities", "Find user groups", "Join meetups", "Build lifelong connections"],
    accent: "#b45309",
  },
  {
    id: "problem-solving",
    title: "Problem solving",
    goal: "Solve a business challenge",
    image: "/event/expo.jpg",
    flow: ["Arrive with a challenge", "Follow relevant content", "Meet experts and peers", "Learn from customers like you", "Develop a path forward"],
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
          Five paths through TechXchange — each mapped to sessions, people, and
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
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="explore-journey-body">
              <span className="narrative-kicker" style={{ color: journey.accent }}>
                {journey.title}
              </span>
              <h2 id={`journey-${journey.id}`} className="explore-journey-goal">
                {journey.goal}
              </h2>
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
            </div>
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
