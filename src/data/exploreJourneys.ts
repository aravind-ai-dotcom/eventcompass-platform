export type JourneyPreviewKind = "session" | "expert" | "certification" | "community" | "networking";

export interface JourneyPreviewCard {
  kind: JourneyPreviewKind;
  kicker: string;
  title: string;
  meta: string;
}

export interface ExploreJourney {
  id: string;
  title: string;
  image: string;
  accent: string;
  outcome: string;
  helps: string[];
  /** Generic capability slots — shown before enrollment (no names or catalog specifics). */
  anonymousPreviews: JourneyPreviewCard[];
  /** Outcome-shaped placeholders after enrollment — still no invented people or session titles. */
  enrolledPreviews: JourneyPreviewCard[];
  cta: { href: string; label: string };
}

export const EXPLORE_JOURNEYS: ExploreJourney[] = [
  {
    id: "certification",
    title: "Earn a certification",
    image: "/forge/visual-trajectory.svg",
    accent: "#6366F1",
    outcome: "Walk into your learning path with a focused plan built around FORGE.",
    helps: [
      "Recommend learning sessions aligned to your certification goal",
      "Identify labs and prep opportunities at the event",
      "Connect you with practitioners who teach the material",
      "Suggest communities for ongoing study support",
    ],
    anonymousPreviews: [
      {
        kind: "session",
        kicker: "Learning sessions",
        title: "Labs and breakouts in your certification area",
        meta: "Surfaced after you share your certification goal",
      },
      {
        kind: "certification",
        kicker: "Learning path",
        title: "A prep path shaped around your target credential",
        meta: "Sessions, labs, and study moments in one plan",
      },
      {
        kind: "expert",
        kicker: "Expert access",
        title: "Practitioners who teach your focus area",
        meta: "Introduced once Compass knows your interests",
      },
    ],
    enrolledPreviews: [
      {
        kind: "session",
        kicker: "Your learning plan",
        title: "Prep sessions prioritized for your certification goal",
        meta: "See titles, times, and match reasons in My Journey",
      },
      {
        kind: "certification",
        kicker: "Learning path",
        title: "Opportunities mapped to your enrolled credentials",
        meta: "Labs and study blocks added to your week",
      },
      {
        kind: "expert",
        kicker: "Expert access",
        title: "Practitioner conversations matched to your study focus",
        meta: "Names and meeting context live in My Journey",
      },
    ],
    cta: { href: "/txc/enroll", label: "Build My Journey" },
  },
  {
    id: "experts",
    title: "Meet the right experts",
    image: "/forge/visual-signals.svg",
    accent: "#3B82F6",
    outcome: "Spend your time with practitioners who match your technology and role.",
    helps: [
      "Surface speakers and technical leaders aligned to your interests",
      "Highlight Meet the Expert moments worth your calendar",
      "Explain why each match is relevant to you",
      "Help you prepare for meaningful conversations",
    ],
    anonymousPreviews: [
      {
        kind: "expert",
        kicker: "Expert matching",
        title: "Practitioners in your technology areas",
        meta: "Unlocked after you share role, products, and interests",
      },
      {
        kind: "session",
        kicker: "Meet the Expert",
        title: "Office hours and small-group technical exchanges",
        meta: "Scheduled once Compass understands your goals",
      },
    ],
    enrolledPreviews: [
      {
        kind: "expert",
        kicker: "People to meet",
        title: "Experts ranked for your profile and intent",
        meta: "Open My Journey for names, context, and why they match",
      },
      {
        kind: "session",
        kicker: "Meet the Expert",
        title: "High-intent sessions on your calendar",
        meta: "Times, locations, and match detail in My Journey",
      },
    ],
    cta: { href: "/txc/enroll", label: "Build My Journey" },
  },
  {
    id: "networking",
    title: "Build meaningful connections",
    image: "/forge/visual-constellation.svg",
    accent: "#3B82F6",
    outcome: "Meet alumni, peers, and practitioners who share your goals — not random hallway luck.",
    helps: [
      "Match you with people who share products and interests",
      "Prioritize mutual-intent networking opportunities",
      "Suggest communities to continue conversations after FORGE",
      "Surface huddles and small-group moments worth joining",
    ],
    anonymousPreviews: [
      {
        kind: "networking",
        kicker: "People to meet",
        title: "Attendees with shared interests and intent",
        meta: "Matches appear after you complete your Compass profile",
      },
      {
        kind: "community",
        kicker: "Community",
        title: "Groups aligned to your technology focus",
        meta: "Continue conversations after the event",
      },
    ],
    enrolledPreviews: [
      {
        kind: "networking",
        kicker: "People to meet",
        title: "Connections ranked for your goals and overlap",
        meta: "Profiles and context available in My Journey",
      },
      {
        kind: "community",
        kicker: "Community",
        title: "Communities recommended from your interests",
        meta: "Join paths surfaced in your plan",
      },
    ],
    cta: { href: "/txc/enroll", label: "Build My Journey" },
  },
  {
    id: "challenge",
    title: "Bring a challenge",
    image: "/forge/hero-crystal-beam.png",
    accent: "#22D3EE",
    outcome: "Turn a real problem into sessions, experts, and peer conversations that move it forward.",
    helps: [
      "Map your challenge to relevant sessions and labs",
      "Identify practitioners who have solved similar problems",
      "Recommend communities and roundtables for peer input",
      "Build a day-by-day plan around your priority",
    ],
    anonymousPreviews: [
      {
        kind: "session",
        kicker: "Problem-solving sessions",
        title: "Breakouts and labs tied to your stated challenge",
        meta: "Prioritized once you describe what you are solving",
      },
      {
        kind: "expert",
        kicker: "Practitioner match",
        title: "Technical leaders with relevant experience",
        meta: "Introduced when Compass knows your challenge area",
      },
    ],
    enrolledPreviews: [
      {
        kind: "session",
        kicker: "Your challenge plan",
        title: "Sessions mapped to the problem you shared",
        meta: "Full list and scheduling detail in My Journey",
      },
      {
        kind: "expert",
        kicker: "Practitioner match",
        title: "Experts aligned to your challenge and domain",
        meta: "Conversation starters and profiles in My Journey",
      },
    ],
    cta: { href: "/txc/enroll", label: "Build My Journey" },
  },
  {
    id: "technology",
    title: "Discover what's next",
    image: "/forge/visual-constellation.svg",
    accent: "#A855F7",
    outcome: "Explore emerging tech through hands-on sessions, demos, and communities — not brochure browsing.",
    helps: [
      "Prioritize sessions on technologies you want to evaluate",
      "Surface labs and demos with limited capacity early",
      "Connect interests to community groups",
      "Balance depth sessions with expo discovery time",
    ],
    anonymousPreviews: [
      {
        kind: "session",
        kicker: "Discovery sessions",
        title: "Demos and breakouts in your interest areas",
        meta: "Ranked after you share technologies to explore",
      },
      {
        kind: "community",
        kicker: "Community",
        title: "Topic groups for ongoing learning",
        meta: "Matched to the domains you care about",
      },
    ],
    enrolledPreviews: [
      {
        kind: "session",
        kicker: "Trending for you",
        title: "Emerging-tech sessions in your personalized plan",
        meta: "Scores, times, and labs in My Journey",
      },
      {
        kind: "community",
        kicker: "Community",
        title: "Groups connected to your learning path",
        meta: "See recommendations in My Journey",
      },
    ],
    cta: { href: "/txc/enroll", label: "Build My Journey" },
  },
  {
    id: "champions",
    title: "Inspire and connect",
    image: "/forge/visual-signals.svg",
    accent: "#3B82F6",
    outcome: "Find attendees and community members who benefit from your experience — and vice versa.",
    helps: [
      "Highlight people seeking guidance in your domains",
      "Recommend community moments worth your time",
      "Surface mentoring and roundtable opportunities",
      "Help you give back without losing your own plan",
    ],
    anonymousPreviews: [
      {
        kind: "networking",
        kicker: "Mentoring opportunities",
        title: "Attendees seeking guidance in your areas",
        meta: "Matches unlock after you share your expertise",
      },
      {
        kind: "community",
        kicker: "Community programs",
        title: "Groups and circles aligned to how you contribute",
        meta: "Explore official programs once your profile is set",
      },
    ],
    enrolledPreviews: [
      {
        kind: "networking",
        kicker: "Give and receive",
        title: "People who benefit from your experience — and vice versa",
        meta: "Profiles and mutual-fit signals in My Journey",
      },
      {
        kind: "community",
        kicker: "Community programs",
        title: "Guide and community moments in your plan",
        meta: "Details and links in My Journey — not on this page",
      },
    ],
    cta: { href: "/txc/enroll", label: "Build My Journey" },
  },
];

const GATED_DESTINATIONS = new Set(["/txc/champions", "/txc/sessions"]);

export function resolveJourneyPreviews(journey: ExploreJourney, enrolled: boolean): JourneyPreviewCard[] {
  return enrolled ? journey.enrolledPreviews : journey.anonymousPreviews;
}

export function resolveJourneyCta(
  journey: ExploreJourney,
  enrolled: boolean,
): { href: string; label: string } {
  if (enrolled) {
    if (journey.cta.href === "/txc/enroll") {
      return { href: "/txc/experience", label: "Open My Journey" };
    }
    return journey.cta;
  }

  if (GATED_DESTINATIONS.has(journey.cta.href)) {
    return { href: "/txc/enroll", label: "Build My Journey" };
  }

  return journey.cta;
}

export function explorePreviewGateCopy(enrolled: boolean): string {
  if (enrolled) {
    return "Session titles, expert profiles, and match detail live in My Journey — not on this page.";
  }
  return "Compass holds specific sessions and people until you sign in and share what matters to you.";
}
