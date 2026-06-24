// =============================================================================
// EventCompass — Trusted event knowledge (Voice Compass concierge)
// src/data/eventKnowledge.ts
//
// Structured facts for deterministic voice responses. No LLM generation.
// =============================================================================

export const EVENT_KNOWLEDGE = {
  event_overview:
    "IBM TechXchange 2026 is the technical learning and community event for developers, architects, data experts, AI engineers, infrastructure professionals, partners, IBM Champions, and technical communities — four days of breakouts, labs, certifications, expert access, and networking in Atlanta.",

  event_dates:
    "TechXchange runs October 26–29, 2026. Community Day and Partner Day kick off Sunday, October 26. Main-stage keynotes are Tuesday and Wednesday morning. Sandbox Block Party is Tuesday evening.",

  event_location:
    "Atlanta, Georgia — primarily at the Georgia World Congress Center, with sessions, labs, the exhibit hall, and evening experiences across the campus.",

  event_purpose:
    "The event brings together learning, technical breakouts, certifications, hands-on labs, community experiences, expert access, networking, and fun — so attendees leave with skills, connections, and a clearer path forward.",

  tracks:
    "Major tracks include AI, App Development, App Integration, Business Management and FinOps, Cloud, Data, Data Security and IAM, IBM Z and LinuxONE, IT Optimization and Automation, Power, Red Hat, and Storage.",

  community_day:
    "Community Day on Sunday, October 26 is the kickoff for IBM Champions, user groups, and community-led experiences — peer learning, meetups, mentoring moments, and shared interests across the technical community.",

  partner_day:
    "Partner Day on Sunday, October 26 is dedicated to IBM Business Partners — ecosystem learning, joint customer stories, sponsor experiences, and networking with IBM teams and practitioners.",

  data_technical_summit:
    "Data Technical Summit is deep technical programming for data practitioners — governance, engineering, analytics, and AI on IBM Data and watsonx, with breakouts, labs, and expert roundtables throughout the week.",

  student_day:
    "Student Dev Day welcomes university students and early-career technologists with career sessions, hands-on labs, mentor access, and peer conversations alongside champions and IBM experts.",

  sandbox_block_party:
    "Sandbox Block Party is Tuesday, October 28 at 6:00 PM in the Exhibit Hall — the signature social evening with demos, music, builder energy, and open networking. Don't miss it.",

  certification_program:
    "TechXchange includes certification opportunities all week — badge exams, instructor-led labs, and study groups. Compass connects your certification journey to the right sessions, labs, experts, and peers.",

  certifications_available:
    "Certification paths commonly include watsonx, Cloud Pak, Red Hat, Security, Data, and IBM Z credentials. Labs and exams run throughout the week. Set your certification journey in My Compass, or mention a cert code for targeted help.",

  champions_program:
    "IBM Champions are community leaders and practitioners who share real-world expertise, mentor peers, and help attendees find the right communities, sessions, and conversations during TechXchange.",

  compass_about:
    "I'm Compass — your TechXchange concierge. I help you prioritize sessions, people, certifications, live huddles, and community moments that fit your goals, so you leave with a plan instead of a pile of options.",

  compass_biggest_concern:
    "The biggest challenge most attendees face is trying to do everything. TechXchange has hundreds of sessions, dozens of communities, certifications, meetups, and evening experiences. My role is to help you focus on what matters most for your goals.",
} as const;

export type EventKnowledgeKey = keyof typeof EVENT_KNOWLEDGE;

export const FUN_ACTIVITIES = [
  {
    id: "sandbox",
    title: "Sandbox Block Party",
    when: "Tuesday, Oct 28 · 6:00 PM",
    location: "Exhibit Hall",
    blurb: "The signature evening social with demos, music, and networking.",
  },
  {
    id: "tuesday-night",
    title: "Tuesday Night Experience",
    when: "Tuesday, Oct 28 · 8:00 PM",
    location: "On campus",
    blurb: "The week's headline evening experience after the Block Party.",
  },
  {
    id: "networking",
    title: "Networking and Entertainment",
    when: "Evenings",
    location: "Main Atrium",
    blurb: "Open networking and community gathering spaces after sessions.",
  },
  {
    id: "arcade",
    title: "TechXchange Arcade",
    when: "Expo hours",
    location: "Experience Zone",
    blurb: "Interactive demos and community fun during the day.",
  },
  {
    id: "community-meetups",
    title: "Community Day meetups",
    when: "Sunday, Oct 26",
    location: "Georgia World Congress Center",
    blurb: "Champion-led and user-group gatherings to start the week.",
  },
  {
    id: "live-huddles",
    title: "Live Huddles",
    when: "Throughout the week",
    location: "My Experience",
    blurb: "Peer conversations forming around your tracks and interests.",
  },
] as const;

export type FunActivity = (typeof FUN_ACTIVITIES)[number];

export const COMPASS_CONVERSATION = {
  role:
    "I'm Compass — your TechXchange concierge. I help you understand the event, discover what's worth your time, meet the right people, and build a plan that fits your goals.",

  help:
    "I can explain TechXchange programming, suggest sessions and people, surface live huddles and meetups, help with certification planning, and guide your day or week. Ask naturally — like 'anything fun tonight?' or 'I'm a champion, what should I focus on?'",

  focus:
    "Start with one anchor goal — a certification, a track, or a community — then let Compass fill in sessions, people, and live conversations around it. That beats trying to optimize every hour.",

  too_much:
    "The biggest challenge most attendees face is trying to do everything. My job is to help you prioritize the sessions, people, certifications, and conversations that matter most — and skip the rest without guilt.",

  why_generic:
    "Compass weighs your goals, learning tracks, certification journey, and connection intent against sessions, champions, and live opportunities — then surfaces what aligns strongest for you right now.",
} as const;

export type CompassConversationKey = keyof typeof COMPASS_CONVERSATION;

export const PERSONA_GUIDANCE: Record<string, string> = {
  partner:
    "As a partner, anchor on Partner Day and ecosystem programming — joint customer sessions, sponsor experiences, and networking with IBM teams and practitioners. Add Sandbox Block Party and partner meetups for the best mix of learning and relationship-building.",

  champion:
    "As a champion, Community Day is your home base — champion meetups, mentoring moments, user-group energy, and helping attendees find their communities. Join Live Huddles you can host or amplify, and point peers to sessions that match their goals.",

  student:
    "As a student, explore Student Dev Day, career-focused breakouts, hands-on labs, and mentor conversations. Champions and peer roundtables are great places to build confidence and connections early in the week.",

  executive:
    "As an executive, prioritize keynotes, strategic breakouts, customer stories, and high-value networking — Executive Leadership circles and partner conversations often deliver the strongest ROI on your time.",

  finops:
    "In financial operations, explore Business Management and FinOps, cloud cost optimization, automation, and architecture sessions. Peer roundtables and Live Huddles with architects and finance leaders are strong follow-ups.",

  developer:
    "As a developer, start with hands-on labs, App Development and Cloud tracks, and Live Huddles with practitioners building on IBM technology. Certification labs pair well if you are pursuing a credential this week.",

  architect:
    "As an architect, focus on cross-track architecture sessions in Cloud, Data, and Integration, plus expert roundtables and design-focused breakouts. Live Huddles often surface the most practical peer patterns.",

  banking:
    "In banking and financial services, prioritize data governance, AI for risk and compliance, hybrid cloud, and FinOps sessions. Connect with architects in peer roundtables and industry meetups.",

  healthcare:
    "In healthcare, focus on data governance, AI for clinical and operational use cases, security, and regulated cloud patterns. Meet experts in breakouts and community meetups aligned to your industry.",
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
    return "Start with Sandbox Block Party Tuesday evening and check Live Huddles on My Experience for conversations forming around you.";
  }
  return `A few good options: ${parts.join(". ")}. Open My Experience for Live Huddles and your Fun plan.`;
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
