"use client";

import type { HuddleParticipantProfile } from "@/lib/huddleParticipants";

interface HuddleParticipantMiniCardProps {
  participant: HuddleParticipantProfile;
  onClose: () => void;
}

export default function HuddleParticipantMiniCard({
  participant,
  onClose,
}: HuddleParticipantMiniCardProps) {
  const initial = participant.firstName[0]?.toUpperCase() ?? "?";
  const fullName = [participant.firstName, participant.lastName].filter(Boolean).join(" ");

  return (
    <div className="huddle-mini-overlay" role="dialog" aria-modal="true" aria-label={`${fullName} profile`}>
      <button type="button" className="huddle-mini-backdrop" aria-label="Close" onClick={onClose} />
      <article className="huddle-mini-card champion-person-card">
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
          <div className="huddle-avatar huddle-avatar--lg" aria-hidden="true">{initial}</div>
          <div style={{ minWidth: 0 }}>
            <p className="connection-signal-name">{fullName}</p>
            {(participant.role || participant.organization) && (
              <p className="connection-signal-meta">
                {[participant.role, participant.organization].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {participant.interests && participant.interests.length > 0 && (
          <>
            <p className="huddle-mini-label">Interests</p>
            <div className="connection-signal-tags">
              {participant.interests.map(tag => (
                <span key={tag} className="connection-signal-tag">{tag}</span>
              ))}
            </div>
          </>
        )}

        {participant.openTo && participant.openTo.length > 0 && (
          <>
            <p className="huddle-mini-label">Open to</p>
            <div className="champion-person-intent">
              {participant.openTo.map(item => (
                <span key={item} className="champion-person-intent-tag">{item}</span>
              ))}
            </div>
          </>
        )}

        {participant.sharedTopics && participant.sharedTopics.length > 0 && (
          <>
            <p className="huddle-mini-label">Shared topics</p>
            <p className="connection-signal-reason">
              {participant.sharedTopics.join(" · ")}
            </p>
          </>
        )}

        <button type="button" className="action-chip" onClick={onClose} style={{ marginTop: "14px" }}>
          Close
        </button>
      </article>
    </div>
  );
}
