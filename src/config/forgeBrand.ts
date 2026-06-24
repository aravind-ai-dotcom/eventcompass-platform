/**
 * IBM TechXchange — attendee experience branding (display copy).
 * Firestore paths and internal IDs remain txc2026 for compatibility.
 */

export const FORGE_EVENT = {
  name: "IBM TechXchange Conference",
  shortName: "TechXchange",
  tagline: "The premier technology conference for builders and practitioners",
  dates: "October 26–30, 2026",
  venue: "Mandalay Bay Convention Center",
  city: "Las Vegas, Nevada",
  locationLine: "Mandalay Bay Convention Center · Las Vegas, Nevada",
} as const;

export const FORGE_PRODUCT = {
  name: "Compass",
  tagline: "Your guide to TechXchange",
  compassIntelligence: "Attendee guidance",
  compassGuidance: "Compass guidance",
  poweredByCompass: "Powered by Compass",
  myJourney: "My Journey",
  buildMyJourney: "Build My Journey",
  forgeJourney: "TechXchange journey",
  compassAi: "Compass",
  askCompassAi: "Ask Compass",
} as const;

export const FORGE_NAV = {
  explore: "Explore",
  sessions: "Sessions",
  guides: "IBM Champions",
  communities: "IBM Community",
  pulse: "Pulse",
  myJourney: "My Journey",
} as const;

export const FORGE_PILLARS = [
  {
    id: "learn",
    kicker: "Before the event",
    title: "Know what to learn before you arrive.",
    body: "Clarify your goals, map sessions to your role, and arrive with a plan — not a blank calendar.",
    href: "/txc/enroll",
    cta: "Build My Journey",
  },
  {
    id: "connect",
    kicker: "During the event",
    title: "Meet the people who accelerate your work.",
    body: "IBM Champions, mentors, and peers matched to your expertise, certification path, and community interests.",
    href: "/txc/champions",
    cta: "Explore IBM Champions",
  },
  {
    id: "experience",
    kicker: "After the event",
    title: "Stay involved through IBM Community.",
    body: "Carry momentum into user groups, Champions programs, and learning paths that continue year-round.",
    href: "/txc/experience",
    cta: "Open My Journey",
  },
] as const;

export const FORGE_EDGE = [
  {
    id: "engineering",
    title: "Technical depth",
    body: "Sessions and labs led by practitioners shipping AI, data, cloud, and security at scale.",
    href: "/txc/sessions",
    accent: "#7C3AED",
  },
  {
    id: "systems",
    title: "Certification paths",
    body: "Structured learning aligned to IBM credentials — with sessions, labs, and study support on site.",
    href: "/txc/explore",
    accent: "#4F8CFF",
  },
  {
    id: "builders",
    title: "IBM Champions",
    body: "Connect with advocates and experts who mentor, present, and lead community programs.",
    href: "/txc/champions",
    accent: "#4F8CFF",
  },
  {
    id: "innovation",
    title: "IBM Community",
    body: "Topic groups and user groups for ongoing knowledge sharing — before, during, and after TechXchange.",
    href: "/txc/communities",
    accent: "#22D3EE",
  },
] as const;

export const FORGE_TRACKS = [
  "Artificial Intelligence",
  "Automation",
  "Cloud",
  "Data & Analytics",
  "Infrastructure",
  "Security",
  "Integration",
  "Industry Solutions",
] as const;

export const FORGE_COMMUNITIES = [
  "IBM Community",
  "IBM Champions",
  "IBM User Groups",
  "IBM Developer",
  "IBM Cloud",
  "IBM Data & AI",
  "IBM Automation",
  "IBM Security",
  "IBM Integration",
  "IBM Z",
  "IBM Power",
  "IBM Storage",
] as const;

export const FORGE_LEARNING_PATHS = [
  "AI Foundations",
  "Cloud Architecture",
  "Data Engineering",
  "Cybersecurity",
  "Automation",
  "Integration",
  "IBM Z",
  "IBM Power",
] as const;

export const FORGE_SESSION_SAMPLES = [
  "Enterprise AI in Production",
  "Modernizing with Hybrid Cloud",
  "Data Fabric Architecture",
  "Zero Trust Security Patterns",
  "Automation at Scale",
  "Integration Best Practices",
  "IBM Z Modernization",
  "Responsible AI Governance",
] as const;

export const FORGE_HIGHLIGHTS = [
  { id: "keynote", title: "Opening Keynote", description: "Set direction for the week with IBM leadership and customer stories." },
  { id: "builder-day", title: "Community Day", description: "User groups, Champions, and peer learning across the technical community." },
  { id: "innovation-showcase", title: "Innovation Showcase", description: "Hands-on experiences with IBM technology and partner solutions." },
  { id: "future-tech", title: "Technical Summit", description: "Deep-dive tracks for architects, developers, and operators." },
  { id: "startup-pavilion", title: "Partner Pavilion", description: "Ecosystem partners, ISVs, and joint customer success stories." },
  { id: "women-building", title: "Women in Technology", description: "Leadership, mentorship, and community programming." },
  { id: "ai-leadership", title: "Executive Exchange", description: "Strategy conversations for technology and business leaders." },
  { id: "innovation-awards", title: "Client Success Awards", description: "Recognizing standout implementations and teams." },
  { id: "closing", title: "Closing Session", description: "Reflect on the week and plan what you take back to your organization." },
] as const;

export const FORGE_ADMIN_SECTIONS = [
  "Event Setup",
  "Branding",
  "Tracks",
  "Communities",
  "IBM Champions",
  "Learning Paths",
  "Agenda",
  "Attendees",
  "Compass",
  "Analytics",
  "Insights",
  "Operations",
] as const;

export const FORGE_ANALYTICS_LABELS = [
  "Attendee Engagement",
  "Community Participation",
  "Learning Path Progress",
  "Champion Connections",
  "Session Popularity",
  "Compass Usage",
  "Networking Signals",
  "Journey Completion",
  "Experience Participation",
] as const;

/** UI label map — internal IDs unchanged */
export const FORGE_LABELS = {
  guide: "Champion",
  guides: "IBM Champions",
  featuredGuides: "Featured Champions",
  guideMatch: "Champion match",
  guideConnections: "Champion connections",
  expertGuides: "IBM Champions",
  community: "IBM Community",
  communities: "IBM Community",
  learningPaths: "Learning paths",
  professionalLearning: "Certification & learning",
  builderDay: "Community Day",
  innovationDay: "Partner Day",
  futureBuildersDay: "Student Day",
  attendees: "Attendees",
} as const;

/** Prepared namespace — not wired to production Firestore paths */
export const FORGE_DEMO_FIRESTORE_BASE = "organizations/demo/events/forge2027";

export const FORGE_EXTERNAL_LINKS = {
  website: process.env.NEXT_PUBLIC_FORGE_EVENT_WEBSITE?.trim() || "",
  keynotes: process.env.NEXT_PUBLIC_FORGE_KEYNOTES_URL?.trim() || "",
  agenda: process.env.NEXT_PUBLIC_FORGE_AGENDA_URL?.trim() || "",
} as const;
