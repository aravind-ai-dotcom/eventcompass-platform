"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatHuddleTimeRange } from "@/lib/huddleSchedule";
import {
  classificationBadgeClass,
  statusBadgeClassForHuddle,
  statusBadgeLabelForHuddle,
} from "@/lib/huddleStatusUi";
import { classificationLabel } from "@/services/huddleMatchingService";
import { fetchParticipantPublicPreview } from "@/services/huddleService";
import type { HuddlesController } from "@/hooks/useHuddles";
import type { HuddleParticipantPreview, MatchedHuddle } from "@/types/huddleDataModel";
import type { LiveOpportunity } from "@/types/liveOpportunity";
import HuddleDetailSheet from "@/components/experience/HuddleDetailSheet";
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

function useMobileWalkLayout(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
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
  const isMobileWalk = useMobileWalkLayout();
  const [expanded, setExpanded] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<HuddleParticipantPreview | null>(null);
  const [hostMenuOpen, setHostMenuOpen] = useState(false);

  const isLive = opp.displayStatus === "happening_now" || opp.displayStatus === "ending_soon";
  const isOnMyWay = huddles.responses[opp.id] === "on_my_way" || opp.userResponse === "on_my_way";
  const userIsHost = participantUid === opp.hostParticipantId ||
    (!!opp.hostName && opp.hostName.trim().toLowerCase() === userDisplayName.trim().toLowerCase());

  const statusLabel = statusBadgeLabelForHuddle(matched);
  const statusClass = statusBadgeClassForHuddle(matched);

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

  const previewEntries = useMemo(() => {
    const entries: Array<{ name: string; initial: string; preview: HuddleParticipantPreview | null; isHost: boolean }> = [
      {
        name: opp.hostName ?? "Host",
        initial: (opp.hostFirstName ?? "H")[0]?.toUpperCase() ?? "H",
        preview: hostPreview,
        isHost: true,
      },
      ...attendeeNames.slice(0, 2).map(name => ({
        name,
        initial: name[0]?.toUpperCase() ?? "?",
        preview: null as HuddleParticipantPreview | null,
        isHost: false,
      })),
    ];
    if (isOnMyWay && !userIsHost && !attendeeNames.some(n => n.toLowerCase() === userFirstName.toLowerCase())) {
      const you = {
        name: userFirstName,
        initial: userFirstName[0]?.toUpperCase() ?? "Y",
        preview: {
          participant_id: participantUid ?? "",
          display_name: userDisplayName,
          first_name: userFirstName,
          badges: [],
        } as HuddleParticipantPreview,
        isHost: false,
      };
      if (entries.length < 4) entries.splice(1, 0, you);
    }
    return entries;
  }, [opp, hostPreview, attendeeNames, isOnMyWay, userIsHost, userFirstName, userDisplayName, participantUid]);

  const attendeePreviews = previewEntries.filter(e => !e.isHost);
  const shownCount = Math.min(3, previewEntries.length);
  const extra = Math.max(0, totalHeading - shownCount);
  const scanMatchLine = opp.matchReasons[0] ?? "Matched to your profile and interests.";

  const openPreview = useCallback(async (preview: HuddleParticipantPreview | null, name: string) => {
    if (preview?.participant_id) {
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

  const openDetails = () => {
    if (isMobileWalk) setDetailSheetOpen(true);
    else setExpanded(v => !v);
  };

  if (isMobileWalk) {
    return (
      <>
        <article className={`huddle-row huddle-row--v2 huddle-row--mobile-walk${isLive ? " huddle-row--live" : ""}`}>
          <div className="huddle-scan">
            <div className="huddle-row-top-badges">
              <span className={classificationBadgeClass(opp.classification ?? "general")}>
                {classificationLabel((opp.classification ?? "general") as MatchedHuddle["classification"])}
              </span>
              <span className={statusClass}>{statusLabel}</span>
            </div>

            <h3 className="huddle-row-title">{opp.title}</h3>
            <p className="huddle-scan-when">
              {formatHuddleTimeRange(matched)}
              {opp.location ? ` · ${opp.location}` : ""}
            </p>

            <button
              type="button"
              className="huddle-host-strip"
              onClick={() => void openPreview(hostPreview, opp.hostName ?? "Host")}
            >
              <span className="huddle-avatar huddle-avatar--host" aria-hidden="true">
                {(opp.hostFirstName ?? "H")[0]?.toUpperCase()}
              </span>
              <span className="huddle-host-strip__text">
                <span className="huddle-role-label">Host</span>
                <span className="huddle-host-name">{opp.hostName}</span>
                {(opp.hostJobTitle || opp.hostOrganization) && (
                  <span className="huddle-host-meta">
                    {[opp.hostJobTitle, opp.hostOrganization].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
            </button>

            <div className="huddle-attendee-block huddle-attendee-block--compact">
              <p className="huddle-role-label">
                {totalHeading} heading there{isOnMyWay ? " · You’re on your way" : ""}
              </p>
              <div className="huddle-avatar-row">
                {previewEntries.slice(0, 3).map(entry => (
                  <button
                    key={entry.name}
                    type="button"
                    className={`huddle-avatar huddle-avatar--btn${entry.isHost ? " huddle-avatar--host" : ""}`}
                    title={entry.name}
                    onClick={() => void openPreview(entry.preview, entry.name)}
                  >
                    {entry.initial}
                  </button>
                ))}
                {extra > 0 && (
                  <span className="huddle-avatar huddle-avatar--more">+{extra}</span>
                )}
              </div>
            </div>

            <p className="huddle-scan-match">{scanMatchLine}</p>
          </div>

          <div className="huddle-row-actions huddle-row-actions--mobile-walk">
            {!userIsHost && (
              <button
                type="button"
                className={`huddle-cta-on-my-way${isOnMyWay ? " huddle-cta-on-my-way--active" : ""}`}
                aria-pressed={isOnMyWay}
                onClick={() => void huddles.respondOnMyWay(opp.id, userDisplayName)}
              >
                {isOnMyWay ? "✓ On My Way" : "On My Way"}
              </button>
            )}
            {userIsHost && (
              <button type="button" className="huddle-cta-on-my-way huddle-cta-on-my-way--host" onClick={openDetails}>
                Host · View details
              </button>
            )}
            <button type="button" className="huddle-details-trigger" onClick={openDetails}>
              Details
            </button>
          </div>
        </article>

        {detailSheetOpen && (
          <HuddleDetailSheet
            opp={opp}
            matched={matched}
            huddles={huddles}
            statusLabel={statusLabel}
            statusClass={statusClass}
            userIsHost={userIsHost}
            isOnMyWay={isOnMyWay}
            userDisplayName={userDisplayName}
            totalHeading={totalHeading}
            onClose={() => setDetailSheetOpen(false)}
            onOpenPreview={(preview, name) => void openPreview(preview, name)}
            hostPreview={hostPreview}
            attendeePreviews={attendeePreviews}
            extraAttendees={extra}
          />
        )}

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

  return (
    <>
      <article className={`huddle-row huddle-row--v2 huddle-row--desktop${isLive ? " huddle-row--live" : ""}`}>
        <div className="huddle-row-top-badges">
          <span className={classificationBadgeClass(opp.classification ?? "general")}>
            {classificationLabel((opp.classification ?? "general") as MatchedHuddle["classification"])}
          </span>
          <span className={statusClass}>{statusLabel}</span>
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
              {previewEntries.slice(0, 3).map(entry => (
                <button
                  key={entry.name}
                  type="button"
                  className="huddle-people-preview__name"
                  onClick={() => void openPreview(entry.preview, entry.name)}
                >
                  {entry.isHost ? `${entry.name} (Host)` : entry.name}
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
