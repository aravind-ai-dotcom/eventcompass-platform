"use client";
// =============================================================================
// EventCompass — Network Panel
// src/components/experience/NetworkPanel.tsx
// "People connected to your journey" — alumni, colleagues, career matches.
// Only shows consenting participants. Safe empty state when no signals.
// =============================================================================

import Image from "next/image";
import {
  getParticipantNetworkSignals,
  scoreNetworkMatch,
  type NetworkMatchResult,
} from "@/services/networkSignalService";

type RawDoc = Record<string, unknown>;

interface MatchWithPhoto extends NetworkMatchResult { photo_url?: string }

interface Props {
  participant:     RawDoc;
  allParticipants: RawDoc[];
}

function LIIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function MatchCard({ match }: { match: MatchWithPhoto }) {
  const initial = (match.display_name[0] ?? "?").toUpperCase();
  return (
    <div style={{ border: "1px solid var(--line)", background: "var(--panel)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {match.photo_url ? (
          <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid var(--accent)" }}>
            <Image src={match.photo_url} alt={match.display_name} width={40} height={40} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
          </div>
        ) : (
          <div className="avatar-fallback" style={{ width: 40, height: 40, fontSize: "0.95rem", flexShrink: 0 }} aria-hidden>{initial}</div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: "0 0 2px", fontWeight: 620, fontSize: "0.92rem", color: "var(--text)", letterSpacing: "-0.01em" }}>{match.display_name}</p>
          {match.current_org && <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.78rem" }}>{match.current_org}</p>}
        </div>
        <span style={{ flexShrink: 0, fontSize: "0.68rem", fontWeight: 680, color: "var(--accent)", border: "1px solid var(--accent)", padding: "1px 6px" }}>{match.score}</span>
      </div>

      {match.reasons.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "3px" }}>
          {match.reasons.slice(0, 3).map(r => (
            <li key={r} style={{ display: "flex", gap: "6px", color: "var(--accent)", fontSize: "0.78rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.5rem", marginTop: "0.4em", flexShrink: 0 }}>◆</span>{r}
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {match.linkedin_url && (
          <a href={match.linkedin_url} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "5px", height: "28px", padding: "0 10px", border: "1px solid #0A66C2", color: "#0A66C2", fontSize: "0.76rem", fontWeight: 650, textDecoration: "none", whiteSpace: "nowrap" }}>
            <LIIcon /> Connect
          </a>
        )}
        <button style={{ display: "inline-flex", alignItems: "center", height: "28px", padding: "0 10px", border: "1px solid var(--line)", background: "transparent", color: "var(--muted)", fontSize: "0.76rem", fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}>
          Save contact
        </button>
      </div>
    </div>
  );
}

export default function NetworkPanel({ participant, allParticipants }: Props) {
  const currentSig = getParticipantNetworkSignals({ ...participant, id: participant.id ?? participant.uid });

  const hasProfile =
    currentSig.education.length > 0 ||
    currentSig.past_employers.length > 0 ||
    currentSig.career_interests.length > 0;

  if (!hasProfile) {
    return (
      <section className="section">
        <div className="section-kicker">People connected to your journey</div>
        <div style={{ marginTop: "16px", border: "1px dashed var(--line)", padding: "28px 24px", textAlign: "center" }}>
          <p style={{ color: "var(--text)", fontWeight: 520, fontSize: "1rem", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Find your hidden network.</p>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: "0 0 18px", lineHeight: 1.55, maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}>
            Add your school, past employers, and career interests to unlock alumni, past-colleague, and career-path connections at TechXchange.
          </p>
          <a href="/profile" className="btn-secondary" style={{ fontSize: "0.88rem" }}>Update my profile</a>
        </div>
      </section>
    );
  }

  const matches: MatchWithPhoto[] = allParticipants
    .map(p => {
      const sig    = getParticipantNetworkSignals({ ...p, id: p.id ?? p.uid });
      const result = scoreNetworkMatch(currentSig, sig);
      return { ...result, photo_url: typeof p.photo_url === "string" ? p.photo_url : undefined };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-kicker">People connected to your journey</div>
          <h2>Alumni and past-colleague signals.</h2>
        </div>
        <p>Matched by shared universities, past employers, and career interests. Only attendees who have opened themselves to connections.</p>
      </div>

      {matches.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          No network matches yet — the event is still filling in.
          Check back as more attendees build their profiles.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "12px" }}>
          {matches.map(m => <MatchCard key={m.uid} match={m} />)}
        </div>
      )}
    </section>
  );
}
