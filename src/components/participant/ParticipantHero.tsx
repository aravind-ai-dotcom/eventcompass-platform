// ─────────────────────────────────────────────────────────────────────────────
// ParticipantHero — attendee identity + intent summary + compass score
// Shown at the top of /experience (My Experience page).
// ─────────────────────────────────────────────────────────────────────────────

import type { Participant } from "@/types";
import CompassScore from "./CompassScore";
import { FORGE_PRODUCT } from "@/config/forgeBrand";

interface Props {
  participant: Participant;
  topScore?: number;  // highest session score, shown as overall Compass match
}

export default function ParticipantHero({ participant, topScore }: Props) {
  const sig    = participant.event_signal_profile;
  const intent = sig?.intent;
  const tracks = sig?.tech_tracks ?? [];
  const goals  = sig?.goals ?? [];

  return (
    <section className="section no-top-border">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) auto",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Identity */}
        <div>
          <div className="section-kicker">{FORGE_PRODUCT.myJourney}</div>
          <h1
            style={{
              fontSize: "clamp(2.4rem, 4.5vw, 4.4rem)",
              lineHeight: 1,
              letterSpacing: "-0.05em",
              fontWeight: 520,
              margin: "0 0 8px",
            }}
          >
            {participant.display_name}
          </h1>
          <p style={{ color: "var(--muted)", margin: "0 0 20px", fontSize: "1.05rem" }}>
            {participant.job_title}
            {participant.company ? ` · ${participant.company}` : ""}
          </p>

          {/* Intent signals */}
          {intent?.needs && intent.needs.length > 0 && (
            <p
              style={{
                color: "var(--soft)",
                lineHeight: 1.55,
                maxWidth: "680px",
                margin: "0 0 18px",
                fontSize: "1rem",
              }}
            >
              {intent.needs[0]}
            </p>
          )}

          {/* Tracks and goals chips */}
          {(tracks.length > 0 || goals.length > 0) && (
            <div className="chip-row">
              {tracks.slice(0, 4).map((t) => (
                <span key={t} className="chip">{t}</span>
              ))}
              {goals.slice(0, 3).map((g) => (
                <span key={g} className="chip">{g}</span>
              ))}
            </div>
          )}
        </div>

        {/* Score badge */}
        {topScore !== undefined && (
          <CompassScore score={topScore} size="lg" />
        )}
      </div>
    </section>
  );
}
