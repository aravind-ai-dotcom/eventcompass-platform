"use client";
// =============================================================================
// EventCompass — Explore  /explore
// "Why Compass Exists" — narrative intelligence surface, not a data dashboard.
// =============================================================================
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const INTELLIGENCE_SECTIONS = [
  {
    kicker: "Learning intelligence",
    title: "Find the right sessions for your goals.",
    body: "Compass maps breakouts, labs, workshops, and hands-on sessions to what you want to learn — so you spend less time browsing and more time building skills.",
  },
  {
    kicker: "Certification intelligence",
    title: "Turn a certification goal into a preparation plan.",
    body: "Whether you are targeting IBM watsonx, Cloud Pak, or Security certifications, Compass connects exam objectives to sessions, labs, and experts already in the room.",
    examples: [
      "IBM watsonx Data Engineer",
      "IBM Cloud Pak for Integration",
      "IBM Security QRadar SIEM",
    ],
  },
  {
    kicker: "Contact intelligence",
    title: "Find experts, peers, mentors, and champions.",
    body: "Compass surfaces the people who can answer your questions — IBM Champions, domain experts, and practitioners who have solved problems like yours.",
  },
  {
    kicker: "Networking intelligence",
    title: "Surface meaningful opportunities.",
    body: "Shared interests, alumni networks, university communities, and career goals become connection opportunities — not random hallway encounters.",
  },
  {
    kicker: "Experience intelligence",
    title: "Optimize your week across Community, Learning, and Fun.",
    body: "Compass balances deep technical learning with community moments and the shared experiences that make TechXchange memorable — shaped to your priorities.",
  },
];

export default function ExplorePage() {
  const { user, enrolled } = useAuth();

  return (
    <>
      <section className="story-hero story-hero--strong story-hero--spacious">
        <div className="section-kicker">Why Compass exists</div>
        <h1>How Compass helps you succeed.</h1>
        <p>
          TechXchange is vast. Compass turns a crowded event into a personal path —
          learning, certification, connections, and experiences aligned to what you
          came to achieve.
        </p>
      </section>

      {INTELLIGENCE_SECTIONS.map((section, i) => (
        <section
          key={section.kicker}
          className={`narrative-section${i === 0 ? " no-top-border" : ""}`}
        >
          <span className="narrative-kicker">{section.kicker}</span>
          <h2 className="narrative-title">{section.title}</h2>
          <p className="narrative-body">{section.body}</p>
          {section.examples && (
            <ul className="narrative-examples" aria-label="Certification examples">
              {section.examples.map(ex => (
                <li key={ex}>{ex}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section className="final-band">
        <div>
          {user && enrolled ? (
            <>
              <h2>Your Compass is live.</h2>
              <p>Sessions, Champions, and your personalised plan are ready.</p>
            </>
          ) : (
            <>
              <h2>Ready to build your path?</h2>
              <p>
                Tell Compass what matters to you and get a personalized TechXchange
                experience in minutes.
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
