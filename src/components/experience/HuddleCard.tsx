"use client";

import { useCallback, useState } from "react";
import { formatHuddleTimeRange } from "@/lib/huddleSchedule";
import {
  classificationBadgeClass,
  resolveDisplayStatus,
  statusBadgeClass,
  statusBadgeLabel,
} from "@/lib/huddleStatusUi";
import { classificationLabel } from "@/services/huddleMatchingService";
import { fetchParticipantPublicPreview } from "@/services/huddleService";
import type { HuddlesController } from "@/hooks/useHuddles";
import type { HuddleParticipantPreview, MatchedHuddle } from "@/types/huddleDataModel";
import type { LiveOpportunity } from "@/types/liveOpportunity";
import HuddleParticipantMiniCard from "@/components/experience/HuddleParticipantMiniCard";

interface HuddleCardProps {
  opp: LiveOpportunity;
  matched: MatchedHuddle;
  huddles: HuddlesController;
  userDisplayName: string;
  userFirstName: string;
  participantUid?: string;
  onSaveContact?: (preview: HuddleParticipantPreview) => void;
}

export default function HuddleCard({
  opp,
  matched,
  huddles,
  userDisplayName,
  userFirstName,
  participantUid,
  onSaveContact,
}: HuddleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<HuddleParticipantPreview | null>(null);
  const [hostMenuOpen, setHostMenuOpen] = useState(false);

  const displayStatus = resolveDisplayStatus(matched);
  const isOnMyWay = huddles.responses[opp.id] === "on_my_way" || opp.userResponse === "on_my_way";
  const userIsHost = participantUid === opp.hostParticipantId ||
    (!!opp.hostName && opp.hostName.trim().toLowerCase() === userDisplayName.trim().toLowerCase());

  const hostPreview: HuddleParticipantPreview = {
    participant_id: opp.hostParticipantId ?? "",
    display_name: opp.hostName ?? "Host",
    first_name: opp.hostFirstName ?? "Host",
    job_title: opp.hostJobTitle,
    organization: opp.hostOrganization,
    is_host: true,
    shared_interest: opp.tags?.[0],
    badges: opp.classification === "champion" ? ["champion"] : opp.classification === "certification" ? ["certification"] : ["community"],
  };

  const attendeeNames = opp.joinedNames.filter(
    n => n.toLowerCase() !== (opp.hostFirstName ?? "").toLowerCase(),
  );
  const totalHeading = opp.joinedCount + (isOnMyWay && !userIsHost ? 1 : 0);
  const previewNames = [
    { name: `${opp.hostFirstName ?? "Host"} (Host)`, preview: hostPreview, isHost: true },
    ...attendeeNames.slice(0, 2).map(name => ({
      name,
      preview: null as HuddleParticipantPreview | null,
      isHost: false,
    })),
  ];
  if (isOnMyWay && !userIsHost && !attendeeNames.includes(userFirstName)) {
    const idx = previewNames.length < 3 ? previewNames.length : 2;
    if (idx < 3) {
      previewNames.splice(1, 0, {
        name: userFirstName,
        preview: {
          participant_id: participantUid ?? "",
          display_name: userDisplayName,
          first_name: userFirstName,
          badges: [],
        },
        isHost: false,
      });
    }
  }
  const shownCount = Math.min(3, previewNames.length);
  const extra = Math.max(0, totalHeading - shownCount);

  const openPreview = useCallback(async (preview: HuddleParticipantPreview | null, name: string) => {
    if (preview) {
      setSelectedPreview(preview);
      return;
    }
    const pid = name.replace(/\s*\(Host\)$/, "");
    const loaded = await fetchParticipantPublicPreview(pid);
    setSelectedPreview(loaded ?? {
      participant_id: "",
      display_name: name,
      first_name: name.split(/\s+/)[0] ?? name,
      badges: [],
    });
  }, []);

  return (
    <>
      <article className={`huddle-row huddle-row--v2${displayStatus === "happening_now" || displayStatus === "ending_soon" ? " huddle-row--live" : ""}`}>
        <div className="huddle-row-top-badges">
          <span className={classificationBadgeClass(opp.classification ?? "general")}>
            {classificationLabel((opp.classification ?? "general") as MatchedHuddle["classification"])}
          </span>
          <span className={statusBadgeClass(displayStatus)}>
            {statusBadgeLabel(displayStatus)}
          </span>
        </div>

        <div className="huddle-row-body">
          <h3 className="huddle-row-title">{opp.title}</h3>
          <p className="huddle-row-time">{formatHuddleTimeRange(matched)}</p>
          {opp.location && (
            <p className="huddle-row-location">{opp.location}</p>
          )}

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

          {opp.sessionConflict && (
            <p className="huddle-row-slot-note huddle-row-slot-note--warn">
              Conflicts with a saved session at this time ({opp.sessionConflict}).
            </p>
          )}

          <div className="huddle-host-block">
            <p className="huddle-role-label">Host</p>
            <button
              type="button"
              className="huddle-host-name"
              onClick={() => void openPreview(hostPreview, opp.hostName ?? "Host")}
            >
              {opp.hostName}
            </button>
            {(opp.hostJobTitle || opp.hostOrganization) && (
              <p className="huddle-host-meta">
                {[opp.hostJobTitle, opp.hostOrganization].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          <div className="huddle-attendee-divider" />
          <div className="huddle-attendee-block">
            <p className="huddle-role-label">Heading there · {totalHeading}</p>
            <div className="huddle-people-preview">
              {previewNames.slice(0, 3).map(entry => (
                <button
                  key={entry.name}
                  type="button"
                  className="huddle-people-preview__name"
                  onClick={() => void openPreview(entry.preview, entry.name)}
                >
                  {entry.name}
                </button>
              ))}
              {extra > 0 && (
                <span className="huddle-people-preview__more">+{extra} more</span>
              )}
            </div>
          </div>

          {expanded && opp.description && (
            <p className="huddle-row-detail">{opp.description}</p>
          )}
        </div>

        <div className="huddle-row-actions">
          {!userIsHost && (
            <>
              <button
                type="button"
                className={`action-chip action-chip--primary${isOnMyWay ? " action-chip--active" : ""}`}
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
            <div className="huddle-host-controls">
              <button type="button" className="action-chip" onClick={() => setHostMenuOpen(v => !v)}>
                Host controls
              </button>
              {hostMenuOpen && (
                <div className="huddle-host-menu">
                  <button type="button" className="action-chip" onClick={() => void huddles.extendHuddle(opp.id)}>Extend time</button>
                  <button type="button" className="action-chip" onClick={() => void huddles.duplicateHuddleById(opp.id)}>Duplicate</button>
                  <button type="button" className="action-chip" onClick={() => void huddles.cancelHuddle(opp.id)}>Cancel</button>
                </div>
              )}
            </div>
          )}

          <button type="button" className="action-chip" onClick={() => setExpanded(v => !v)}>
            {expanded ? "Less" : "Details"}
          </button>
          <button type="button" className="action-chip action-chip--ghost" onClick={() => void huddles.hideHuddleById(opp.id)}>
            Hide
          </button>
          <button type="button" className="action-chip action-chip--ghost" onClick={() => void huddles.reportHuddleById(opp.id)}>
            Report
          </button>
        </div>
      </article>

      {selectedPreview && (
        <HuddleParticipantMiniCard
          participant={selectedPreview}
          onClose={() => setSelectedPreview(null)}
          onSaveContact={onSaveContact ? () => onSaveContact(selectedPreview) : undefined}
        />
      )}
    </>
  );
}
