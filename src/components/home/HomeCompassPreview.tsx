"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FORGE_PRODUCT } from "@/config/forgeBrand";

const ANONYMOUS_ITEMS = [
  {
    kind: "session",
    kicker: "Sessions",
    title: "Prioritized labs and breakouts for your role",
    meta: "Personalized once you build your journey",
  },
  {
    kind: "expert",
    kicker: "IBM Champions",
    title: "Experts aligned to your technology focus",
    meta: "Champion profiles appear once you build your journey",
  },
  {
    kind: "certification",
    kicker: "Certification",
    title: "Learning path around your credential goals",
    meta: "Sessions, labs, and study blocks in one plan",
  },
  {
    kind: "networking",
    kicker: "People",
    title: "Peers and mentors worth your time",
    meta: "Introductions based on your stated intent",
  },
] as const;

const ENROLLED_ITEMS = [
  {
    kind: "session",
    kicker: "Your learning plan",
    title: "Sessions ranked for your profile",
    meta: `See titles, times, and scores in ${FORGE_PRODUCT.myJourney}`,
  },
  {
    kind: "expert",
    kicker: "People to meet",
    title: "IBM Champions and peers matched to you",
    meta: `Profiles and reasons live in ${FORGE_PRODUCT.myJourney}`,
  },
  {
    kind: "certification",
    kicker: "Learning path",
    title: "Professional learning in your plan",
    meta: "Labs and study blocks personalized for you",
  },
  {
    kind: "networking",
    kicker: "Communities",
    title: "Groups aligned with your interests",
    meta: "Continue conversations beyond the event",
  },
] as const;

export default function HomeCompassPreview() {
  const { user, enrolled } = useAuth();
  const items = user && enrolled ? ENROLLED_ITEMS : ANONYMOUS_ITEMS;

  return (
    <aside className="home-compass-preview" aria-label="Compass preview">
      <div className="home-compass-preview__head">
        <span className="home-compass-preview__kicker">{FORGE_PRODUCT.compassIntelligence}</span>
        <p className="home-compass-preview__note">
          {user && enrolled
            ? `Recommendations aligned to your profile — see your plan in ${FORGE_PRODUCT.myJourney}.`
            : "What to learn, who to meet, and how to stay involved — personalized when you build your journey."}
        </p>
      </div>
      <ul className="home-compass-preview__list">
        {items.map(item => (
          <li key={item.kind} className="home-compass-preview__card">
            <div className="home-compass-preview__card-top">
              <span className="home-compass-preview__card-kicker">{item.kicker}</span>
            </div>
            <p className="home-compass-preview__card-title">{item.title}</p>
            <p className="home-compass-preview__card-meta">{item.meta}</p>
          </li>
        ))}
      </ul>
      {!user && (
        <Link href="/txc/enroll" className="home-compass-preview__cta">
          {FORGE_PRODUCT.buildMyJourney} →
        </Link>
      )}
    </aside>
  );
}
