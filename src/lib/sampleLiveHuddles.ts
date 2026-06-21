import type { LiveOpportunity } from "@/types/liveOpportunity";
import {
  HUDDLE_COPY,
  addMinutes,
  nextFutureClockTime,
  withHuddleSchedule,
} from "@/lib/huddleLifecycle";

const SAMPLE_SCHEDULE = [
  { id: "agentic-ai-prod", clock: "2:30 PM", happeningNow: true },
  { id: "alumni-coffee", clock: "3:00 PM" },
  { id: "cloud-migration", clock: "3:15 PM" },
  { id: "exec-leadership", clock: "3:30 PM" },
  { id: "data-governance", clock: "4:00 PM" },
  { id: "cert-study", clock: "5:00 PM" },
] as const;

const SAMPLE_BASE: LiveOpportunity[] = [
  {
    id: "agentic-ai-prod",
    category: "Technology",
    title: "Agentic AI in Production",
    description: "Peers comparing production patterns for agentic AI — architecture, governance, and rollout.",
    location: "Innovation Hub",
    joinedCount: 3,
    joinedNames: ["Priya Chandrasekaran", "Jordan Lee"],
    hostName: "Alex Morgan",
    hostFirstName: "Alex",
    emoji: "🔥",
    source: "ai-generated",
    matchReasons: ["Aligns with your Agentic AI track", "Matches architects in your network"],
    filterKeys: ["agentic ai", "ai", "production"],
    tags: ["AI"],
    classification: "technology",
    status: HUDDLE_COPY.slotNote,
  },
  {
    id: "alumni-coffee",
    category: "Alumni",
    title: "Alumni coffee chat",
    description: "Graduates reconnecting — share career paths, campus memories, and who you know at the event.",
    location: "Community Lounge A",
    joinedCount: 2,
    joinedNames: ["Sam", "Chris"],
    hostName: "Jordan Lee",
    hostFirstName: "Jordan",
    emoji: "🎓",
    source: "alumni",
    matchReasons: ["Shared alumni network", "Open to informal meetups"],
    filterKeys: ["alumni", "networking"],
    tags: ["Alumni"],
    classification: "alumni",
    status: HUDDLE_COPY.slotNote,
  },
  {
    id: "cloud-migration",
    category: "Cloud",
    title: "Cloud Migration Roundtable",
    description: "Open roundtable on hybrid migration lessons and architecture trade-offs.",
    location: "Community Lounge B",
    joinedCount: 2,
    joinedNames: ["Maya Patel", "Carlos"],
    hostName: "Maya Patel",
    hostFirstName: "Maya",
    emoji: "☁️",
    source: "networking",
    matchReasons: ["Supports your cloud architecture goals"],
    filterKeys: ["cloud", "migration", "architecture"],
    tags: ["Cloud"],
    classification: "technology",
    status: HUDDLE_COPY.slotNote,
  },
  {
    id: "exec-leadership",
    category: "Leadership",
    title: "Executive Leadership Circle",
    description: "Small-group conversation on strategy, team leadership, and executive priorities this week.",
    location: "Executive Lounge",
    joinedCount: 2,
    joinedNames: ["Thomas", "Lina"],
    hostName: "Sarah Kim",
    hostFirstName: "Sarah",
    emoji: "✦",
    source: "networking",
    matchReasons: ["Relevant for executive priorities this week"],
    filterKeys: ["executive", "leadership", "strategy"],
    tags: ["Leadership"],
    classification: "career",
    status: HUDDLE_COPY.slotNote,
  },
  {
    id: "data-governance",
    category: "Data",
    title: "Data Governance Exchange",
    description: "Compare notes on policy, lineage, and compliance patterns across teams.",
    location: "Data Studio",
    joinedCount: 2,
    joinedNames: ["Elena", "Rob"],
    hostName: "Nikhil Rao",
    hostFirstName: "Nikhil",
    emoji: "📊",
    source: "networking",
    matchReasons: ["Matches your data governance interests"],
    filterKeys: ["data", "governance", "compliance"],
    tags: ["Data"],
    classification: "technology",
    status: HUDDLE_COPY.slotNote,
  },
  {
    id: "cert-study",
    category: "Certification",
    title: "Certification Study Group",
    description: "Focused prep session — share resources, exam tips, and study plans.",
    location: "Learning Hub",
    joinedCount: 2,
    joinedNames: ["Sarah", "Ben"],
    hostName: "Nikhil Rao",
    hostFirstName: "Nikhil",
    emoji: "📋",
    source: "certification",
    matchReasons: ["Recommended for your certification journey"],
    filterKeys: ["certification", "study group"],
    tags: ["Certification"],
    classification: "certification",
    status: HUDDLE_COPY.slotNote,
  },
];

function applySampleSchedule(huddle: LiveOpportunity): LiveOpportunity {
  const slot = SAMPLE_SCHEDULE.find(s => s.id === huddle.id);
  if (!slot) return huddle;
  const now = new Date();
  const scheduled = "happeningNow" in slot && slot.happeningNow
    ? addMinutes(now, -5)
    : nextFutureClockTime(slot.clock, now);
  return withHuddleSchedule(huddle, scheduled);
}

export const SAMPLE_LIVE_HUDDLES: LiveOpportunity[] = SAMPLE_BASE.map(applySampleSchedule);

export function rankLiveHuddles(
  huddles: LiveOpportunity[],
  tracks: string[] = [],
  goals: string[] = [],
): LiveOpportunity[] {
  const profile = [...tracks, ...goals].map(v => v.toLowerCase());
  return [...huddles]
    .map(h => {
      const reasons = h.matchReasons.map(r => r.toLowerCase());
      let score = 0;
      for (const term of profile) {
        if (reasons.some(r => r.includes(term) || term.includes(r))) score += 2;
        if (h.filterKeys.some(k => term.includes(k) || k.includes(term))) score += 1;
      }
      return { h, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ta = a.h.scheduledAt ? new Date(a.h.scheduledAt).getTime() : 0;
      const tb = b.h.scheduledAt ? new Date(b.h.scheduledAt).getTime() : 0;
      return ta - tb;
    })
    .map(x => x.h);
}
