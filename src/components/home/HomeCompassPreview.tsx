"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FORGE_PRODUCT } from "@/config/forgeBrand";

const ANONYMOUS_ITEMS = [
  {
    kind: "session",
    kicker: "Sessions",
    title: "Labs and breakouts matched to your goals",
    meta: `Unlocked after you ${FORGE_PRODUCT.buildMyJourney.toLowerCase()}`,
  },
  {
    kind: "expert",
    kicker: "Guide access",
    title: "Experts in your technology areas",
    meta: "Names and context stay private until you enroll",
  },
  {
    kind: "certification",
    kicker: "Learning path",
    title: "A plan around your professional learning goals",
    meta: "Sessions and experiences added to your week",
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
    meta: `See titles, times, and scores in ${FORGE_PRODUCT.myJourney}`,
  },
  {
    kind: "expert",
    kicker: "People to meet",
    title: "Guides and peers matched to you",
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
            ? `Signals aligned to your profile — recommendations live in ${FORGE_PRODUCT.myJourney}.`
            : "Opportunities appear once Compass understands your goals. Build your journey to activate guidance."}
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
