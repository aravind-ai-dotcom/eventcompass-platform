// =============================================================================
// EventCompass — Trusted event knowledge (Voice Compass)
// src/data/eventKnowledge.ts
//
// Structured facts for deterministic voice responses. No LLM generation.
// =============================================================================

export const EVENT_KNOWLEDGE = {
  event_overview:
    "IBM TechXchange 2026 is a technical learning and community event for developers, architects, data experts, AI engineers, infrastructure professionals, partners, IBM Champions, and technical communities.",

  event_dates:
    "IBM TechXchange 2026 is planned for October 26–29, 2026.",

  event_location:
    "Atlanta, Georgia.",

  event_purpose:
    "The event brings together learning, technical breakouts, certifications, hands-on labs, community experiences, expert access, networking, and fun.",

  tracks:
    "AI, App Development, App Integration, Business Management & FinOps, Cloud, Data, Data Security & IAM, IBM Z & LinuxONE, IT Optimization & Automation, Power, Red Hat, and Storage.",

  community_day:
    "Community Day focuses on user groups, peer learning, shared interests, and community-led experiences.",

  partner_day:
    "Partner Day focuses on ecosystem relationships, partner learning, collaboration, and celebration.",

  sandbox_block_party:
    "Sandbox Block Party is a social and community gathering designed for networking, celebration, and fun.",

  certification_program:
    "TechXchange includes certification opportunities. Compass can help attendees connect certification goals to sessions, labs, experts, and study groups.",

  champions_program:
    "IBM Champions and community leaders bring practical knowledge, mentorship, and peer guidance into the event.",

  compass_about:
    "Compass helps attendees understand what matters most, discover relevant sessions, meet the right people, find live conversations, and build a personalized event experience.",

  compass_biggest_concern:
    "The biggest challenge is not lack of information. It is helping attendees focus. With many sessions, people, certifications, communities, and live opportunities, Compass helps prioritize what matters most.",
} as const;

export type EventKnowledgeKey = keyof typeof EVENT_KNOWLEDGE;

export const PERSONA_GUIDANCE: Record<string, string> = {
  partner:
    "Start with Partner Day, ecosystem sessions, sponsor experiences, and networking moments with IBM teams and customers.",
  champion:
    "Focus on Community Day, champion meetups, mentoring moments, and helping attendees find their communities.",
  student:
    "Explore Student Dev Day, career-focused sessions, labs, and peer conversations with mentors and champions.",
  executive:
    "Prioritize keynotes, strategic breakouts, customer stories, and high-value networking with leaders and partners.",
  finops:
    "Explore Business Management & FinOps, cloud cost optimization, automation, and peer conversations with architecture and finance leaders.",
  developer:
    "Start with hands-on labs, App Development and Cloud tracks, and live conversations with practitioners building on IBM technology.",
  architect:
    "Focus on architecture sessions across Cloud, Data, and Integration tracks, plus expert roundtables and design-focused breakouts.",
};

export type PersonaKey = keyof typeof PERSONA_GUIDANCE;
