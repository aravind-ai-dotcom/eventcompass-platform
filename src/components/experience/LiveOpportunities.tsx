"use client";

import { useMemo } from "react";
import type { LiveOpportunity } from "@/types/liveOpportunity";

const HUDDLES: LiveOpportunity[] = [
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

function scoreOpportunity(
  opp: LiveOpportunity,
  tracks: string[],
  goals: string[],
): number {
  const profile = [...tracks, ...goals].map(v => v.toLowerCase());
  const reasons = opp.matchReasons.map(r => r.toLowerCase());
  let score = 0;
  for (const term of profile) {
    if (reasons.some(r => r.includes(term) || term.includes(r))) score += 2;
    if (opp.filterKeys.some(k => term.includes(k) || k.includes(term))) score += 1;
  }
  return score;
}

function formatJoined(names: string[], total: number): string {
  const shown = names.slice(0, 3).join(", ");
  const extra = Math.max(0, total - names.length);
  return extra > 0 ? `${shown} +${extra}` : shown;
}

interface LiveOpportunitiesProps {
  participantTracks?: string[];
  participantGoals?: string[];
}

export default function LiveOpportunities({
  participantTracks = [],
  participantGoals = [],
}: LiveOpportunitiesProps) {
  const visible = useMemo(() => {
    return [...HUDDLES]
      .map(opp => ({ opp, score: scoreOpportunity(opp, participantTracks, participantGoals) }))
      .sort((a, b) => b.score - a.score)
      .map(x => x.opp)
      .slice(0, 6);
  }, [participantTracks, participantGoals]);

  return (
    <div className="live-opportunities">
      <header className="live-opportunities-head">
        <span className="live-opportunities-kicker">Live opportunities</span>
        <h2 className="live-opportunities-title">Conversations forming around you</h2>
        <p className="live-opportunities-desc">
          Small huddles, study groups, alumni moments, and topic conversations matched to your intent.
        </p>
      </header>

      <ul className="huddle-feed" aria-label="Live huddles">
        {visible.map(opp => (
          <li key={opp.id}>
            <article className="huddle-row">
              <div className="huddle-row-badge">
                <span aria-hidden="true">{opp.emoji}</span>
                {opp.category}
              </div>

              <div className="huddle-row-body">
                <h3 className="huddle-row-title">{opp.title}</h3>
                <p className="huddle-row-meta">
                  {opp.status}
                  {opp.location ? ` · ${opp.location}` : ""}
                  {` · ${opp.joinedCount} joined`}
                </p>
                <p className="huddle-row-people">
                  Joined: {formatJoined(opp.joinedNames, opp.joinedCount)}
                </p>
                <p className="huddle-row-match">
                  Matched because: {opp.matchReasons.join(" · ")}
                </p>
              </div>

              <div className="huddle-row-actions">
                <button type="button" className="action-chip">Join</button>
                <button type="button" className="action-chip">Details</button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
