// =============================================================================
// EventCompass — Trusted event knowledge (Voice Compass concierge)
// src/data/eventKnowledge.ts
//
// Structured facts for deterministic voice responses. No LLM generation.
// =============================================================================

import { FORGE_EVENT, FORGE_LABELS, FORGE_PRODUCT } from "@/config/forgeBrand";

export const EVENT_KNOWLEDGE = {
  event_overview:
    `${FORGE_EVENT.name} is IBM's premier technology conference — five days of technical sessions, hands-on labs, IBM Champions, IBM Community, and certification learning in ${FORGE_EVENT.city}.`,

  event_dates:
    `${FORGE_EVENT.shortName} runs ${FORGE_EVENT.dates} at ${FORGE_EVENT.venue} in ${FORGE_EVENT.city}.`,

  event_location:
    `${FORGE_EVENT.locationLine} — sessions, labs, showcases, and community experiences across the venue.`,

  event_purpose:
    `${FORGE_EVENT.shortName} brings together learning, expert access, IBM Community, and hands-on building — so attendees leave with skills, connections, and a clearer path forward.`,

  tracks:
    "Major tracks include Artificial Intelligence, Automation, Cloud, Data & Analytics, Infrastructure, Security, Integration, and Industry Solutions.",

  community_day:
    "Community programming connects practitioners, IBM Champions, and peer groups — user groups, mentoring moments, and shared interests across IBM Community.",

  partner_day:
    "Partner and ecosystem programming features joint customer stories, sponsor experiences, and networking with practitioners and platform teams.",

  data_technical_summit:
    "Deep technical programming for data practitioners — governance, engineering, analytics, and AI, with breakouts, labs, and expert roundtables throughout the week.",

  student_day:
    "Student and early-career programming welcomes university technologists with career sessions, hands-on labs, mentor access, and peer conversations alongside IBM Champions.",

  sandbox_block_party:
    "Evening experiences include showcases, community gatherings, and open networking — signature social moments after the day's sessions.",

  certification_program:
    `${FORGE_EVENT.shortName} includes professional learning paths all week — labs, study groups, and credentials. Compass connects your learning journey to the right sessions, labs, IBM Champions, and peers.`,

  certifications_available:
    "Learning paths include AI Foundations, Cloud Architecture, Data Engineering, Cybersecurity, Automation, Integration, IBM Z, and IBM Power. Set your journey in My Journey, or mention a path for targeted guidance.",

  champions_program:
    `${FORGE_LABELS.guides} are practitioners and community leaders who share real-world expertise, mentor peers, and help attendees find the right IBM Community groups, sessions, and conversations during ${FORGE_EVENT.shortName}.`,

  compass_about:
    `I'm Compass — your guide to ${FORGE_EVENT.shortName}. I help you prioritize sessions, IBM Champions, learning paths, live huddles, and IBM Community moments that fit your goals.`,

  compass_biggest_concern:
    `The biggest challenge most attendees face is trying to do everything. ${FORGE_EVENT.shortName} has hundreds of sessions, dozens of community groups, learning paths, meetups, and evening experiences. Compass helps you focus on what matters most.`,
} as const;

export type EventKnowledgeKey = keyof typeof EVENT_KNOWLEDGE;

export const FUN_ACTIVITIES = [
  {
    id: "sandbox",
    title: "Innovation Showcase Evening",
    when: "Wednesday · 6:00 PM",
    location: "Main Hall",
    blurb: "The signature evening social with hands-on experiences, builder energy, and networking.",
  },
  {
    id: "tuesday-night",
    title: "Wednesday Night Experience",
    when: "Wednesday · 8:00 PM",
    location: FORGE_EVENT.venue,
    blurb: "The week's headline evening experience after the showcase.",
  },
  {
    id: "networking",
    title: "Networking and Entertainment",
    when: "Evenings",
    location: "Atrium",
    blurb: "Open networking and community gathering spaces after sessions.",
  },
  {
    id: "arcade",
    title: "Innovation Showcase",
    when: "Expo hours",
    location: "Experience Zone",
    blurb: "Hands-on experiences and community moments during the day.",
  },
  {
    id: "community-meetups",
    title: "IBM Community meetups",
    when: "Sunday, Oct 25",
    location: FORGE_EVENT.venue,
    blurb: "Champion-led and user-group gatherings to start the week.",
  },
  {
    id: "live-huddles",
    title: "Live Huddles",
    when: "Throughout the week",
    location: FORGE_PRODUCT.myJourney,
    blurb: "Peer conversations forming around your tracks and interests.",
  },
] as const;

export type FunActivity = (typeof FUN_ACTIVITIES)[number];

export const COMPASS_CONVERSATION = {
  role:
    `I'm Compass — your guide to ${FORGE_EVENT.shortName}. I help you understand the conference, discover what's worth your time, meet the right IBM Champions, and build a plan that fits your goals.`,

  help:
    `I can explain ${FORGE_EVENT.shortName} programming, suggest sessions and IBM Champions, surface live huddles and meetups, help with certification planning, and guide your day or week. Ask naturally — like "what's worth my time tomorrow?" or "I'm focused on cloud architecture."`,

  focus:
    "Start with one anchor goal — a certification path, a track, or an IBM Community group — then let Compass fill in sessions, Champions, and live conversations around it.",

  too_much:
    "The biggest challenge most attendees face is trying to do everything. Compass helps you prioritize the sessions, IBM Champions, learning paths, and conversations that matter most.",

  why_generic:
    "Compass weighs your goals, learning tracks, and connection intent against sessions, IBM Champions, and live opportunities — then surfaces what aligns strongest for you right now.",
} as const;

export type CompassConversationKey = keyof typeof COMPASS_CONVERSATION;

export const PERSONA_GUIDANCE: Record<string, string> = {
  partner:
    "As a partner, anchor on Partner Day and ecosystem programming — joint customer sessions, sponsor experiences, and networking with practitioners and platform teams. Add evening showcases and partner meetups for the best mix of learning and relationship-building.",

  champion:
    `As an IBM Champion, community programming is your home base — meetups, mentoring moments, user-group energy, and helping attendees find their IBM Community groups. Join Live Huddles you can host or amplify, and point peers to sessions that match their goals.`,

  student:
    "As a student, explore Student Day, career-focused breakouts, hands-on labs, and mentor conversations. IBM Champions and peer roundtables are great places to build confidence and connections early in the week.",

  executive:
    "As an executive, prioritize keynotes, strategic breakouts, customer stories, and high-value networking — Executive Exchange and partner conversations often deliver the strongest ROI on your time.",

  finops:
    "In financial operations, explore cloud cost optimization, automation, and architecture sessions. Peer roundtables and Live Huddles with architects and finance leaders are strong follow-ups.",

  developer:
    "As a developer, start with hands-on labs, engineering and cloud tracks, and Live Huddles with practitioners building production systems. Certification labs pair well if you are pursuing a credential this week.",

  architect:
    "As an architect, focus on cross-track architecture sessions in Cloud, Data, and Integration, plus expert roundtables and design-focused breakouts. Live Huddles often surface the most practical peer patterns.",

  banking:
    "In banking and financial services, prioritize data governance, AI for risk and compliance, hybrid cloud, and FinOps sessions. Connect with architects in peer roundtables and industry meetups.",

  healthcare:
    "In healthcare, focus on data governance, AI for clinical and operational use cases, security, and regulated cloud patterns. Meet experts in breakouts and IBM Community meetups aligned to your industry.",
};

export type PersonaKey = keyof typeof PERSONA_GUIDANCE;

export function pickFunActivities(options: {
  evening?: boolean;
  social?: boolean;
  networking?: boolean;
  limit?: number;
}): FunActivity[] {
  const { evening, social, networking, limit = 4 } = options;
  const scored = FUN_ACTIVITIES.map(item => {
    let score = 1;
    if (evening && (item.id === "sandbox" || item.id === "tuesday-night" || item.id === "networking")) {
      score += 3;
    }
    if (social && (item.id === "sandbox" || item.id === "arcade" || item.id === "community-meetups")) {
      score += 2;
    }
    if (networking && (item.id === "networking" || item.id === "live-huddles" || item.id === "sandbox")) {
      score += 2;
    }
    if (item.id === "live-huddles") score += 1;
    return { item, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.item);
}

export function formatFunDiscoverySpoken(
  activities: FunActivity[],
  huddleTitle?: string,
): string {
  const parts = activities.map(a => `${a.title} (${a.when}, ${a.location})`);
  if (huddleTitle) parts.push(`${huddleTitle} forming now in Live Huddles`);
  if (parts.length === 0) {
    return `Start with the Innovation Showcase Wednesday evening and check Live Huddles on ${FORGE_PRODUCT.myJourney} for conversations forming around you.`;
  }
  return `A few good options: ${parts.join(". ")}. Open ${FORGE_PRODUCT.myJourney} for Live Huddles and your evening plan.`;
}

export function formatFunDiscoveryDisplay(
  activities: FunActivity[],
  huddleTitle?: string,
): string {
  const labels: string[] = activities.map(a => a.title);
  if (huddleTitle) labels.push(huddleTitle);
  return labels.join(" · ");
}

export function resolveCompassConversationTopic(norm: string): CompassConversationKey {
  if (
    norm.includes("too much") ||
    norm.includes("overwhelm") ||
    norm.includes("do everything")
  ) {
    return "too_much";
  }
  if (norm.includes("biggest concern") || norm.includes("focus on") || norm.includes("should i focus")) {
    return "focus";
  }
  if (
    norm.includes("why did you recommend") ||
    norm.includes("why recommend") ||
    norm.includes("how do recommendations work") ||
    norm.includes("how recommendations work")
  ) {
    return "why_generic";
  }
  if (norm.includes("help me") || norm.includes("how can you help") || norm.includes("what can you do")) {
    return "help";
  }
  return "role";
}
