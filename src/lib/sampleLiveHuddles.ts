import type { LiveOpportunity } from "@/types/liveOpportunity";

export const SAMPLE_LIVE_HUDDLES: LiveOpportunity[] = [
  {
    id: "agentic-ai-prod",
    category: "AI",
    title: "Agentic AI in Production",
    description: "",
    location: "Innovation Hub",
    status: "Happening now",
    joinedCount: 12,
    joinedNames: ["Priya", "Jordan", "Alex"],
    emoji: "🔥",
    source: "ai-generated",
    matchReasons: ["Agentic AI", "Architecture", "Governance"],
    filterKeys: ["agentic ai", "ai", "production"],
    tags: ["AI"],
  },
  {
    id: "cloud-migration",
    category: "Cloud",
    title: "Cloud Migration Roundtable",
    description: "",
    location: "Community Lounge B",
    status: "Starts in 15 min",
    joinedCount: 9,
    joinedNames: ["Maya", "Sam", "Carlos"],
    emoji: "☁️",
    source: "networking",
    matchReasons: ["Cloud", "Migration", "Architecture"],
    filterKeys: ["cloud", "migration", "architecture"],
    tags: ["Cloud"],
  },
  {
    id: "exec-leadership",
    category: "Leadership",
    title: "Executive Leadership Circle",
    description: "",
    location: "Executive Lounge",
    status: "In progress",
    joinedCount: 7,
    joinedNames: ["Sarah", "Thomas", "Lina"],
    emoji: "✦",
    source: "networking",
    matchReasons: ["Leadership", "Strategy", "AI"],
    filterKeys: ["executive", "leadership", "strategy"],
    tags: ["Leadership"],
  },
  {
    id: "data-governance",
    category: "Data",
    title: "Data Governance Exchange",
    description: "",
    location: "Data Studio",
    status: "Starts in 25 min",
    joinedCount: 8,
    joinedNames: ["Nikhil", "Elena", "Rob"],
    emoji: "📊",
    source: "networking",
    matchReasons: ["Data governance", "Compliance", "AI"],
    filterKeys: ["data", "governance", "compliance"],
    tags: ["Data"],
  },
  {
    id: "openshift-arch",
    category: "Platform",
    title: "OpenShift Architecture Exchange",
    description: "",
    location: "Platform Lab",
    status: "Starts in 40 min",
    joinedCount: 10,
    joinedNames: ["Jordan", "Kumar", "Ben"],
    emoji: "⚙️",
    source: "networking",
    matchReasons: ["OpenShift", "Kubernetes", "Architecture"],
    filterKeys: ["openshift", "kubernetes", "platform"],
    tags: ["Platform"],
  },
  {
    id: "cert-study",
    category: "Certification",
    title: "Certification Study Group",
    description: "",
    location: "Learning Hub",
    status: "Starts in 20 min",
    joinedCount: 11,
    joinedNames: ["Nikhil", "Sarah", "Ben"],
    emoji: "📋",
    source: "certification",
    matchReasons: ["Certification goal", "Exam readiness"],
    filterKeys: ["certification", "exam"],
    tags: ["Certification"],
  },
];

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
    .sort((a, b) => b.score - a.score)
    .map(x => x.h);
}
