/**
 * FORGE 2027 demo event — vendor-neutral Compass branding.
 * Display copy and demo content only; Firestore paths remain txc2026 for compatibility.
 */

export const FORGE_EVENT = {
  name: "FORGE 2027",
  tagline: "Building What's Next",
  dates: "February 16–19, 2027",
  venue: "Bayfront Innovation Center",
  city: "San Francisco, California",
  locationLine: "Bayfront Innovation Center · San Francisco, California",
} as const;

export const FORGE_PRODUCT = {
  name: "Compass",
  tagline: "The intelligence layer for your event",
  myJourney: "My Journey",
  buildMyJourney: "Build My Journey",
  forgeJourney: "FORGE Journey",
  compassAi: "Compass AI",
  askCompassAi: "Ask Compass AI",
} as const;

export const FORGE_NAV = {
  explore: "Explore",
  sessions: "Sessions",
  guides: "Guides",
  communities: "Communities",
  pulse: "Pulse",
  myJourney: "My Journey",
} as const;

export const FORGE_PILLARS = [
  {
    id: "learn",
    kicker: "Learn",
    title: "Discover what matters before you arrive.",
    body: "Skills, insights, and ideas — mapped to learning paths and sessions that fit your goals.",
    href: "/txc/enroll",
    cta: "Build My Journey",
  },
  {
    id: "connect",
    kicker: "Connect",
    title: "Find guides, peers, and communities in the room.",
    body: "Build relationships with experts, mentors, and builders who share your interests.",
    href: "/txc/champions",
    cta: "Explore guides",
  },
  {
    id: "experience",
    kicker: "Experience",
    title: "Live FORGE with clarity.",
    body: "Participate in moments that create lasting value — sessions, showcases, and hands-on experiences.",
    href: "/txc/experience",
    cta: "Open My Journey",
  },
] as const;

/** Home capability grid — builder-focused destinations */
export const FORGE_EDGE = [
  {
    id: "engineering",
    title: "Engineering Excellence",
    body: "Deep technical sessions from practitioners building production systems at scale.",
    href: "/txc/sessions",
    accent: "#6366F1",
  },
  {
    id: "systems",
    title: "Future Systems",
    body: "Explore architectures, platforms, and infrastructure shaping the next decade.",
    href: "/txc/explore",
    accent: "#3B82F6",
  },
  {
    id: "builders",
    title: "Builder Community",
    body: "Connect with engineers, architects, and technical leaders who ship.",
    href: "/txc/champions",
    accent: "#3B82F6",
  },
  {
    id: "innovation",
    title: "Innovation Showcase",
    body: "See emerging products, prototypes, and platform demos from the frontier.",
    href: "/txc/communities",
    accent: "#22D3EE",
  },
] as const;

export const FORGE_TRACKS = [
  "Artificial Intelligence",
  "Cloud & Platform Engineering",
  "Data & Analytics",
  "Cybersecurity",
  "Software Engineering",
  "Product & Experience",
  "Emerging Technologies",
  "Leadership & Transformation",
] as const;

export const FORGE_COMMUNITIES = [
  "AI Builders Guild",
  "Cloud Architects Network",
  "Data Innovators Forum",
  "Security Collective",
  "Platform Engineering Community",
  "Product Leaders Exchange",
  "Women Building Technology",
  "Startup Founders Circle",
  "Future Technologies Network",
  "Developer Experience Guild",
  "Modern Infrastructure Forum",
  "Digital Transformation Network",
] as const;

export const FORGE_LEARNING_PATHS = [
  "AI Foundations",
  "Cloud Architecture",
  "Platform Engineering",
  "Cybersecurity",
  "Data Engineering",
  "Product Leadership",
  "Developer Productivity",
  "Future Technologies",
] as const;

export const FORGE_SESSION_SAMPLES = [
  "Building Production AI Agents",
  "Enterprise Multi-Agent Architectures",
  "Scaling Kubernetes Platforms",
  "Modern Data Product Design",
  "AI Governance in Practice",
  "Platform Engineering at Scale",
  "Secure Cloud Foundations",
  "Developer Productivity with AI",
  "Observability Beyond Monitoring",
  "Zero Trust Architecture Patterns",
  "Building Internal Developer Platforms",
  "Designing AI-Native Experiences",
  "Modern API Strategies",
  "Responsible AI Frameworks",
  "Future of Human-AI Collaboration",
] as const;

export const FORGE_HIGHLIGHTS = [
  { id: "keynote", title: "Opening Keynote", description: "Set the tone for four days of building what's next." },
  { id: "builder-day", title: "Builder Day", description: "Hands-on community programming for builders and practitioners." },
  { id: "innovation-showcase", title: "Innovation Showcase", description: "See emerging products, prototypes, and platform demos." },
  { id: "future-tech", title: "Future Technologies Forum", description: "Explore what's next in AI, spatial computing, and robotics." },
  { id: "startup-pavilion", title: "Startup Pavilion", description: "Meet founders and early-stage teams shaping new categories." },
  { id: "women-building", title: "Women Building Technology Summit", description: "Leadership, mentorship, and community for women in tech." },
  { id: "ai-leadership", title: "AI Leadership Exchange", description: "Executive conversations on responsible AI and strategy." },
  { id: "innovation-awards", title: "Innovation Awards", description: "Celebrate standout builders and teams at FORGE." },
  { id: "closing", title: "Closing Celebration", description: "Close the week together — connections, wins, and what's next." },
] as const;

export const FORGE_ADMIN_SECTIONS = [
  "Event Setup",
  "Branding",
  "Tracks",
  "Communities",
  "Guides",
  "Learning Paths",
  "Agenda",
  "Attendees",
  "Compass AI",
  "Analytics",
  "Insights",
  "Operations",
] as const;

export const FORGE_ANALYTICS_LABELS = [
  "Attendee Engagement",
  "Community Participation",
  "Learning Path Progress",
  "Guide Connections",
  "Session Popularity",
  "Compass AI Usage",
  "Networking Signals",
  "Journey Completion",
  "Experience Participation",
] as const;

/** UI label map — internal IDs unchanged */
export const FORGE_LABELS = {
  guide: "Guide",
  guides: "Guides",
  featuredGuides: "Featured Guides",
  guideMatch: "Guide Match",
  guideConnections: "Guide Connections",
  expertGuides: "Expert Guides",
  community: "Community",
  communities: "Communities",
  learningPaths: "Learning Paths",
  professionalLearning: "Professional Learning",
  builderDay: "Builder Day",
  innovationDay: "Innovation Day",
  futureBuildersDay: "Future Builders Day",
  attendees: "Attendees",
} as const;

/** Demo Firestore namespace (prepared, not wired by default) */
export const FORGE_DEMO_FIRESTORE_BASE = "organizations/demo/events/forge2027";

/**
 * Optional external event links — hidden from UI unless set via env.
 * Set in .env.local for demos / behind-the-scenes sharing only:
 *   NEXT_PUBLIC_FORGE_EVENT_WEBSITE=https://…
 *   NEXT_PUBLIC_FORGE_KEYNOTES_URL=https://…
 *   NEXT_PUBLIC_FORGE_AGENDA_URL=https://…
 */
export const FORGE_EXTERNAL_LINKS = {
  website: process.env.NEXT_PUBLIC_FORGE_EVENT_WEBSITE?.trim() || "",
  keynotes: process.env.NEXT_PUBLIC_FORGE_KEYNOTES_URL?.trim() || "",
  agenda: process.env.NEXT_PUBLIC_FORGE_AGENDA_URL?.trim() || "",
} as const;
