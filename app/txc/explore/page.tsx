"use client";
// =============================================================================
// EventCompass — Explore  /txc/explore
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
  summary: string;
  href?: string;
  accessLabel?: string;
}

const JOURNEYS: Journey[] = [
  {
    id: "learning",
    title: "Learn New Technology",
    goal: "I want to learn something new.",
    image: "/event/ibm_txc_banner_1.jpg",
    flow: ["Discover", "Learn", "Practice", "Connect", "Apply"],
    accent: "#0f62fe",
    summary:
      "Compass helps prioritize the sessions, labs, experts, and communities that can accelerate your learning.",
  },
  {
    id: "certification",
    title: "Earn a Certification",
    goal: "I want to earn a certification.",
    image: "/event/ibm_txc_banner_4.jpg",
    flow: ["Choose", "Prepare", "Practice", "Mentor", "Achieve"],
    accent: "#a56eff",
    summary:
      "Compass connects certifications to sessions, labs, experts, study groups, and community support.",
  },
  {
    id: "networking",
    title: "Find Your People",
    goal: "I want to meet the right people.",
    image: "/event/ibm_txc_banner_5.jpg",
    flow: ["Discover", "Connect", "Meet", "Share", "Grow"],
    accent: "#005d5d",
    summary:
      "Compass introduces experts, peers, champions, speakers, and communities aligned to your interests.",
  },
  {
    id: "community",
    title: "Grow Community",
    goal: "I want to engage with a community.",
    image: "/event/community-v2.jpg",
    flow: ["Explore", "Join", "Participate", "Contribute", "Belong"],
    accent: "#b45309",
    summary:
      "Compass helps uncover user groups, meetups, discussions, and community experiences.",
  },
  {
    id: "problem-solving",
    title: "Solve a Challenge",
    goal: "I need answers and ideas.",
    image: "/event/expo.jpg",
    flow: ["Define", "Learn", "Discuss", "Refine", "Deliver"],
    accent: "#da1e28",
    summary:
      "Compass helps connect relevant content, experts, peer conversations, and practical solutions.",
  },
  {
    id: "champions",
    title: "Champion Others",
    goal: "I want to share what I know.",
    image: "/event/ibm-champion-journey.png",
    flow: ["Meet", "Guide", "Inspire", "Support", "Amplify"],
    accent: "#0f62fe",
    summary:
      "Compass helps champions connect with attendees, share expertise, and strengthen the community.",
    href: "/txc/champions",
    accessLabel: "Meet Champions",
  },
];

export default function ExplorePage() {
  const { user, enrolled } = useAuth();

  return (
    <>
      <section className="story-hero story-hero--strong story-hero--spacious explore-hero">
        <div className="section-kicker">Explore · Compass</div>
        <h1>How Compass helps you succeed.</h1>
        <p className="explore-hero-lead">
          Choose what you want to accomplish. Compass helps connect the sessions,
          people, communities, certifications, and live opportunities that move you forward.
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
                alt={journey.title}
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="explore-journey-body">
              <h2 id={`journey-${journey.id}`} className="explore-journey-title">
                {journey.title}
              </h2>
              <p className="explore-journey-goal">{journey.goal}</p>
              <p className="explore-journey-summary">{journey.summary}</p>
              <p className="explore-journey-path-kicker">Your journey</p>
              <ol
                className="explore-milestone-path explore-journey-milestones"
                aria-label={`${journey.title} journey`}
              >
                {journey.flow.map((step, stepIndex) => (
                  <li key={step} className="explore-milestone-step">
                    <div className="explore-milestone-node">
                      <span
                        className="explore-milestone-dot"
                        style={{
                          borderColor: journey.accent,
                          background: stepIndex === 0 ? journey.accent : "var(--surface)",
                        }}
                        aria-hidden="true"
                      />
                      {stepIndex < journey.flow.length - 1 && (
                        <span
                          className="explore-milestone-line"
                          style={{ background: journey.accent }}
                          aria-hidden="true"
                        />
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
              <h2>Start with what you want to accomplish.</h2>
              <p>Tell Compass your goals and build a TechXchange experience that moves you forward.</p>
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
