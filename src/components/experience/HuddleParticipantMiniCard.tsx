"use client";

import type { HuddleParticipantPreview } from "@/types/huddleDataModel";

interface HuddleParticipantMiniCardProps {
  participant: HuddleParticipantPreview;
  onClose: () => void;
  onSaveContact?: () => void;
  onViewProfile?: () => void;
}

const BADGE_LABELS: Record<string, string> = {
  champion: "Champion",
  community: "Community",
  certification: "Certification",
};

export default function HuddleParticipantMiniCard({
  participant,
  onClose,
  onSaveContact,
  onViewProfile,
}: HuddleParticipantMiniCardProps) {
  const initial = participant.first_name[0]?.toUpperCase() ?? "?";

  return (
    <div className="huddle-mini-overlay" role="dialog" aria-modal="true" aria-label={`${participant.display_name} profile`}>
      <button type="button" className="huddle-mini-backdrop" aria-label="Close" onClick={onClose} />
      <article className="huddle-mini-card champion-person-card">
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
          <div className="huddle-avatar huddle-avatar--lg" aria-hidden="true">{initial}</div>
          <div style={{ minWidth: 0 }}>
            <p className="connection-signal-name">
              {participant.display_name}
              {participant.is_host ? " · Host" : ""}
            </p>
            {(participant.job_title || participant.organization) && (
              <p className="connection-signal-meta">
                {[participant.job_title, participant.organization].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {participant.shared_interest && (
          <>
            <p className="huddle-mini-label">Shared interest</p>
            <p className="connection-signal-reason">{participant.shared_interest}</p>
          </>
        )}

        {participant.badges.length > 0 && (
          <>
            <p className="huddle-mini-label">Badges</p>
            <div className="connection-signal-tags">
              {participant.badges.map(b => (
                <span key={b} className="connection-signal-tag">{BADGE_LABELS[b] ?? b}</span>
              ))}
            </div>
          </>
        )}

        <p className="huddle-trust-note">No messaging or contact details are shared here.</p>

        <div className="huddle-mini-actions">
          {onViewProfile && (
            <button type="button" className="action-chip" onClick={onViewProfile}>View Profile</button>
          )}
          {onSaveContact && (
            <button type="button" className="action-chip action-chip--primary" onClick={onSaveContact}>
              Save Contact
            </button>
          )}
          <button type="button" className="action-chip" onClick={onClose}>Close</button>
        </div>
      </article>
    </div>
  );
}
