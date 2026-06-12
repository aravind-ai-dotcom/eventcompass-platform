import type { LiveOpportunity } from "@/types/liveOpportunity";

export const SAMPLE_LIVE_HUDDLES: LiveOpportunity[] = [
  {
    id: "qiskit-banking",
    category: "Trending",
    title: "Qiskit for Banking",
    description: "",
    location: "Community Lounge B",
    status: "Starts in 15 min",
    joinedCount: 8,
    joinedNames: ["Maya", "Sam", "Carlos"],
    emoji: "🔥",
    source: "networking",
    matchReasons: ["Quantum", "Banking", "Architecture"],
    filterKeys: ["qiskit", "quantum", "banking", "trending"],
    tags: ["Quantum", "Banking"],
  },
  {
    id: "agentic-ai",
    category: "AI",
    title: "Agentic AI Architecture",
    description: "",
    location: "Innovation Hub",
    status: "Happening now",
    joinedCount: 12,
    joinedNames: ["Priya", "Jordan", "Alex"],
    emoji: "☁️",
    source: "ai-generated",
    matchReasons: ["Agentic AI", "Architecture", "Governance"],
    filterKeys: ["agentic ai", "ai", "architecture"],
    tags: ["AI"],
  },
  {
    id: "iit-alumni",
    category: "Alumni",
    title: "IIT Madras Alumni Meetup",
    description: "",
    location: "Community Commons",
    status: "Tonight · 7:00 PM",
    joinedCount: 6,
    joinedNames: ["Aravind", "Kumar", "Priya"],
    emoji: "🎓",
    source: "alumni",
    matchReasons: ["Alumni connections"],
    filterKeys: ["alumni", "iit"],
    tags: ["Alumni"],
  },
  {
    id: "former-ibmers",
    category: "Past employers",
    title: "Former IBMers Coffee",
    description: "",
    location: "Coffee Bar East",
    status: "Starts in 30 min",
    joinedCount: 9,
    joinedNames: ["Maya", "Rob", "Elena"],
    emoji: "☕",
    source: "networking",
    matchReasons: ["Former employer network"],
    filterKeys: ["employer", "ibm", "coffee"],
    tags: ["Networking"],
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
    matchReasons: ["Certification goal", "Qiskit"],
    filterKeys: ["certification", "qiskit"],
    tags: ["Certification"],
  },
  {
    id: "vip-gathering",
    category: "VIP",
    title: "VIP / Executive Gathering",
    description: "",
    location: "Executive Lounge",
    status: "In progress",
    joinedCount: 7,
    joinedNames: ["Sarah", "Thomas", "Lina"],
    emoji: "✦",
    source: "networking",
    matchReasons: ["Leadership", "Strategy", "AI"],
    filterKeys: ["vip", "executive", "leadership"],
    tags: ["Leadership"],
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
