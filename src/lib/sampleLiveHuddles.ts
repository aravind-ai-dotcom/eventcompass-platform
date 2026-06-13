import type { LiveOpportunity } from "@/types/liveOpportunity";
import {
  HUDDLE_COPY,
  addMinutes,
  nextFutureClockTime,
  withHuddleSchedule,
} from "@/lib/huddleLifecycle";

const SAMPLE_SCHEDULE = [
  { id: "agentic-ai-prod", clock: "2:30 PM", happeningNow: true },
  { id: "cloud-migration", clock: "3:00 PM" },
  { id: "exec-leadership", clock: "3:30 PM" },
  { id: "data-governance", clock: "4:00 PM" },
  { id: "openshift-arch", clock: "4:30 PM" },
  { id: "cert-study", clock: "5:00 PM" },
] as const;

const SAMPLE_BASE: LiveOpportunity[] = [
  {
    id: "agentic-ai-prod",
    category: "AI",
    title: "Agentic AI in Production",
    description: "",
    location: "Innovation Hub",
    joinedCount: 12,
    joinedNames: ["Priya", "Jordan", "Alex"],
    hostName: "Aravind Ragupathi",
    hostFirstName: "Aravind",
    emoji: "🔥",
    source: "ai-generated",
    matchReasons: ["Agentic AI", "Architecture", "Governance"],
    filterKeys: ["agentic ai", "ai", "production"],
    tags: ["AI"],
    status: HUDDLE_COPY.slotNote,
  },
  {
    id: "cloud-migration",
    category: "Cloud",
    title: "Cloud Migration Roundtable",
    description: "",
    location: "Community Lounge B",
    joinedCount: 9,
    joinedNames: ["Sam", "Carlos"],
    hostName: "Maya Patel",
    hostFirstName: "Maya",
    emoji: "☁️",
    source: "networking",
    matchReasons: ["Cloud", "Migration", "Architecture"],
    filterKeys: ["cloud", "migration", "architecture"],
    tags: ["Cloud"],
    status: HUDDLE_COPY.slotNote,
  },
  {
    id: "exec-leadership",
    category: "Leadership",
    title: "Executive Leadership Circle",
    description: "",
    location: "Executive Lounge",
    joinedCount: 7,
    joinedNames: ["Thomas", "Lina"],
    hostName: "Sarah Kim",
    hostFirstName: "Sarah",
    emoji: "✦",
    source: "networking",
    matchReasons: ["Leadership", "Strategy", "AI"],
    filterKeys: ["executive", "leadership", "strategy"],
    tags: ["Leadership"],
    status: HUDDLE_COPY.slotNote,
  },
  {
    id: "data-governance",
    category: "Data",
    title: "Data Governance Exchange",
    description: "",
    location: "Data Studio",
    joinedCount: 8,
    joinedNames: ["Elena", "Rob"],
    hostName: "Nikhil Rao",
    hostFirstName: "Nikhil",
    emoji: "📊",
    source: "networking",
    matchReasons: ["Data governance", "Compliance", "AI"],
    filterKeys: ["data", "governance", "compliance"],
    tags: ["Data"],
    status: HUDDLE_COPY.slotNote,
  },
  {
    id: "openshift-arch",
    category: "Platform",
    title: "OpenShift Architecture Exchange",
    description: "",
    location: "Platform Lab",
    joinedCount: 10,
    joinedNames: ["Kumar", "Ben"],
    hostName: "Jordan Lee",
    hostFirstName: "Jordan",
    emoji: "⚙️",
    source: "networking",
    matchReasons: ["OpenShift", "Kubernetes", "Architecture"],
    filterKeys: ["openshift", "kubernetes", "platform"],
    tags: ["Platform"],
    status: HUDDLE_COPY.slotNote,
  },
  {
    id: "cert-study",
    category: "Certification",
    title: "Certification Study Group",
    description: "",
    location: "Learning Hub",
    joinedCount: 11,
    joinedNames: ["Sarah", "Ben"],
    hostName: "Nikhil Rao",
    hostFirstName: "Nikhil",
    emoji: "📋",
    source: "certification",
    matchReasons: ["Certification journey", "Study with peers"],
    filterKeys: ["certification", "study group"],
    tags: ["Certification"],
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
