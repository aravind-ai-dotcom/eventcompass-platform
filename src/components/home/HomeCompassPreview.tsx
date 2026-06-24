"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const ANONYMOUS_ITEMS = [
  {
    kind: "session",
    kicker: "Learning sessions",
    title: "Labs and breakouts matched to your goals",
    meta: "Unlocked after you build your Compass profile",
  },
  {
    kind: "expert",
    kicker: "Expert access",
    title: "Practitioners in your technology areas",
    meta: "Names and context stay private until you enroll",
  },
  {
    kind: "certification",
    kicker: "Certification path",
    title: "A study plan around your credential targets",
    meta: "Prep sessions and labs added to your week",
  },
  {
    kind: "networking",
    kicker: "People to meet",
    title: "Attendees with shared interests and intent",
    meta: "Matches appear once Compass knows your goals",
  },
] as const;

const ENROLLED_ITEMS = [
  {
    kind: "session",
    kicker: "Your learning plan",
    title: "Sessions ranked for your profile",
    meta: "See titles, times, and scores in My Compass",
  },
  {
    kind: "expert",
    kicker: "People to meet",
    title: "Experts and peers matched to you",
    meta: "Profiles and reasons live in My Compass",
  },
  {
    kind: "certification",
    kicker: "Certification path",
    title: "Prep opportunities in your plan",
    meta: "Labs and study blocks personalized for you",
  },
  {
    kind: "networking",
    kicker: "Networking",
    title: "Connections with mutual intent signals",
    meta: "Open My Compass for full detail",
  },
] as const;

export default function HomeCompassPreview() {
  const { user, enrolled } = useAuth();
  const isPersonalized = Boolean(user && enrolled);
  const items = isPersonalized ? ENROLLED_ITEMS : ANONYMOUS_ITEMS;

  return (
    <aside className="home-compass-preview" aria-label="How Compass recommendations work">
      <header className="home-compass-preview__head">
        <span className="home-compass-preview__kicker">
          {isPersonalized ? "Your Compass" : "How Compass works"}
        </span>
        <p className="home-compass-preview__note">
          {isPersonalized
            ? "Your real sessions and matches are in My Compass — this is the shape of what you will see."
            : "Compass does not show specific sessions or people until you sign in and build your profile."}
        </p>
      </header>
      <ul className="home-compass-preview__list">
        {items.map(item => (
          <li key={item.title} className={`home-compass-preview__card home-compass-preview__card--${item.kind}`}>
            <div className="home-compass-preview__card-top">
              <span className="home-compass-preview__card-kicker">{item.kicker}</span>
            </div>
            <p className="home-compass-preview__card-title">{item.title}</p>
            <p className="home-compass-preview__card-meta">{item.meta}</p>
          </li>
        ))}
      </ul>
      {isPersonalized && (
        <div className="home-compass-preview__foot">
          <Link href="/txc/experience" className="action-chip">
            Open My Compass →
          </Link>
        </div>
      )}
    </aside>
  );
}
