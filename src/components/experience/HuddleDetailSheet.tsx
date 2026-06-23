"use client";

import { useEffect } from "react";
import { formatHuddleTimeRange } from "@/lib/huddleSchedule";
import { classificationBadgeClass } from "@/lib/huddleStatusUi";
import { classificationLabel } from "@/services/huddleMatchingService";
import type { HuddlesController } from "@/hooks/useHuddles";
import type { HuddleParticipantPreview, MatchedHuddle } from "@/types/huddleDataModel";
import type { LiveOpportunity } from "@/types/liveOpportunity";

interface HuddleDetailSheetProps {
  opp: LiveOpportunity;
  matched: MatchedHuddle;
  huddles: HuddlesController;
  statusLabel: string;
  statusClass: string;
  userIsHost: boolean;
  isOnMyWay: boolean;
  userDisplayName: string;
  totalHeading: number;
  onClose: () => void;
  onOpenPreview: (preview: HuddleParticipantPreview | null, name: string) => void;
  hostPreview: HuddleParticipantPreview;
  attendeePreviews: Array<{ name: string; initial: string; preview: HuddleParticipantPreview | null }>;
  extraAttendees: number;
}

export default function HuddleDetailSheet({
  opp,
  matched,
  huddles,
  statusLabel,
  statusClass,
  userIsHost,
  isOnMyWay,
  userDisplayName,
  totalHeading,
  onClose,
  onOpenPreview,
  hostPreview,
  attendeePreviews,
  extraAttendees,
}: HuddleDetailSheetProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="huddle-mini-overlay huddle-mini-overlay--sheet-mobile huddle-detail-sheet-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${opp.title} details`}
    >
      <button type="button" className="huddle-mini-backdrop" aria-label="Close" onClick={onClose} />
      <article className="huddle-detail-sheet">
        <div className="huddle-detail-sheet__handle" aria-hidden="true" />
        <div className="huddle-row-top-badges">
          <span className={classificationBadgeClass(opp.classification ?? "general")}>
            {classificationLabel((opp.classification ?? "general") as MatchedHuddle["classification"])}
          </span>
          <span className={statusClass}>{statusLabel}</span>
        </div>

        <h3 className="huddle-row-title">{opp.title}</h3>
        {opp.description && (
          <p className="huddle-row-detail">{opp.description}</p>
        )}
        <p className="huddle-row-time">{formatHuddleTimeRange(matched)}</p>
        {opp.location && <p className="huddle-row-location">{opp.location}</p>}

        <div className="huddle-host-block">
          <p className="huddle-role-label">Host</p>
          <button
            type="button"
            className="huddle-host-strip"
            onClick={() => onOpenPreview(hostPreview, opp.hostName ?? "Host")}
          >
            <span className="huddle-avatar huddle-avatar--host" aria-hidden="true">
              {(opp.hostFirstName ?? "H")[0]?.toUpperCase()}
            </span>
            <span className="huddle-host-strip__text">
              <span className="huddle-host-name">{opp.hostName}</span>
              {(opp.hostJobTitle || opp.hostOrganization) && (
                <span className="huddle-host-meta">
                  {[opp.hostJobTitle, opp.hostOrganization].filter(Boolean).join(" · ")}
                </span>
              )}
            </span>
          </button>
        </div>

        <div className="huddle-attendee-block">
          <p className="huddle-role-label">Heading there · {totalHeading}</p>
          <div className="huddle-avatar-row">
            {attendeePreviews.map(entry => (
              <button
                key={entry.name}
                type="button"
                className="huddle-avatar huddle-avatar--btn"
                title={entry.name}
                onClick={() => onOpenPreview(entry.preview, entry.name)}
              >
                {entry.initial}
              </button>
            ))}
            {extraAttendees > 0 && (
              <span className="huddle-avatar huddle-avatar--more">+{extraAttendees}</span>
            )}
          </div>
        </div>

        {opp.matchReasons.length > 0 && (
          <div className="huddle-match-block">
            <p className="huddle-match-heading">Matched because:</p>
            <ul className="huddle-match-list">
              {opp.matchReasons.map(r => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {opp.description && <p className="huddle-row-detail">{opp.description}</p>}

        {opp.sessionConflict && (
          <p className="huddle-row-slot-note huddle-row-slot-note--warn">
            Conflicts with a saved session at this time ({opp.sessionConflict}).
          </p>
        )}

        <div className="huddle-detail-sheet__actions">
          {!userIsHost && (
            <>
              <button
                type="button"
                className={`huddle-cta-on-my-way${isOnMyWay ? " huddle-cta-on-my-way--active" : ""}`}
                aria-pressed={isOnMyWay}
                onClick={() => void huddles.respondOnMyWay(opp.id, userDisplayName)}
              >
                {isOnMyWay ? "✓ On My Way" : "On My Way"}
              </button>
              <button
                type="button"
                className="action-chip"
                onClick={() => void huddles.respondNotForMe(opp.id, matched.classification)}
              >
                Not For Me
              </button>
            </>
          )}
          {userIsHost && (
            <>
              <button type="button" className="action-chip" onClick={() => void huddles.extendHuddle(opp.id)}>Extend time</button>
              <button type="button" className="action-chip" onClick={() => void huddles.duplicateHuddleById(opp.id)}>Duplicate</button>
              <button type="button" className="action-chip action-chip--destructive" onClick={() => void huddles.cancelHuddle(opp.id)}>Cancel huddle</button>
            </>
          )}
          <button type="button" className="action-chip action-chip--ghost" onClick={() => void huddles.hideHuddleById(opp.id)}>
            Hide
          </button>
          <button type="button" className="action-chip action-chip--ghost" onClick={() => void huddles.reportHuddleById(opp.id)}>
            Report
          </button>
        </div>
      </article>
    </div>
  );
}
