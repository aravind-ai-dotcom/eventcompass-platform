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
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<HuddleParticipantPreview | null>(null);
  const [hostMenuOpen, setHostMenuOpen] = useState(false);

  const isLive = opp.displayStatus === "happening_now" || opp.displayStatus === "ending_soon";
  const isOnMyWay = huddles.responses[opp.id] === "on_my_way" || opp.userResponse === "on_my_way";
  const userIsHost = participantUid === opp.hostParticipantId ||
    (!!opp.hostName && opp.hostName.trim().toLowerCase() === userDisplayName.trim().toLowerCase());

  const statusLabel = statusBadgeLabelForHuddle(matched);
  const statusClass = statusBadgeClassForHuddle(matched);
  const classLabel = classificationLabel((opp.classification ?? "general") as MatchedHuddle["classification"]);
  const classClass = classificationBadgeClass(opp.classification ?? "general");

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
      ...attendeeNames.map(name => ({
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
      entries.push(you);
    }
    return entries;
  }, [opp, hostPreview, attendeeNames, isOnMyWay, userIsHost, userFirstName, userDisplayName, participantUid]);

  const attendeePreviews = previewEntries.filter(e => !e.isHost);
  const shownCount = Math.min(4, previewEntries.length);
  const extra = Math.max(0, totalHeading - shownCount);
  const scheduleLine = `${formatHuddleTimeRange(matched)}${opp.location ? ` · ${opp.location}` : ""}`;

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
  };

  return (
    <>
      <article className={`huddle-row huddle-row--compact${isLive ? " huddle-row--live" : ""}`}>
        <div className="huddle-compact-line huddle-compact-line--meta">
          <div className="huddle-compact-badges">
            <span className={`${classClass} huddle-badge--category`} title={`Category: ${classLabel}`}>
              {classLabel}
            </span>
            <span className={`${statusClass} huddle-badge--status`} title={`Status: ${statusLabel}`}>
              {statusLabel}
            </span>
          </div>
          <span className="huddle-compact-schedule">{scheduleLine}</span>
        </div>

        <div className="huddle-compact-line huddle-compact-line--title">
          <h3 className="huddle-row-title">{opp.title}</h3>
          {opp.description && (
            <p className="huddle-compact-desc">{opp.description}</p>
          )}
        </div>

        <div className="huddle-compact-line huddle-compact-line--foot">
          <div className="huddle-compact-people">
            <span className="huddle-compact-people__label">
              {totalHeading} heading{isOnMyWay && !userIsHost ? " · You’re in" : ""}
            </span>
            <div className="huddle-avatar-row huddle-avatar-row--compact">
              {previewEntries.slice(0, 4).map(entry => (
                <button
                  key={`${entry.name}-${entry.isHost ? "host" : "guest"}`}
                  type="button"
                  className={`huddle-avatar huddle-avatar--btn huddle-avatar--sm${entry.isHost ? " huddle-avatar--host" : ""}`}
                  title={entry.isHost ? `${entry.name} (Host)` : entry.name}
                  onClick={() => void openPreview(entry.preview, entry.name)}
                >
                  {entry.initial}
                </button>
              ))}
              {extra > 0 && (
                <span className="huddle-avatar huddle-avatar--more huddle-avatar--sm">+{extra}</span>
              )}
              <span className="huddle-compact-names">
                {previewEntries.slice(0, 3).map(entry => (
                  <button
                    key={`name-${entry.name}`}
                    type="button"
                    className="huddle-compact-name"
                    onClick={() => void openPreview(entry.preview, entry.name)}
                  >
                    {entry.isHost ? `${entry.name.split(/\s+/)[0]} (host)` : entry.name.split(/\s+/)[0]}
                  </button>
                ))}
              </span>
            </div>
          </div>

          <div className="huddle-compact-actions">
            {!userIsHost && (
              <>
                <button
                  type="button"
                  className={`action-chip action-chip--compact${isOnMyWay ? " action-chip--active" : ""}`}
                  aria-pressed={isOnMyWay}
                  onClick={() => void huddles.respondOnMyWay(opp.id, userDisplayName)}
                >
                  {isOnMyWay ? "✓ On my way" : "On my way"}
                </button>
                <button
                  type="button"
                  className="action-chip action-chip--compact action-chip--ghost"
                  onClick={() => void huddles.respondNotForMe(opp.id, matched.classification)}
                >
                  Pass
                </button>
              </>
            )}
            {userIsHost && (
              <div className="huddle-host-controls">
                <button type="button" className="action-chip action-chip--compact" onClick={() => setHostMenuOpen(v => !v)}>
                  Host
                </button>
                {hostMenuOpen && (
                  <div className="huddle-host-menu">
                    <button type="button" className="action-chip action-chip--compact" onClick={() => void huddles.extendHuddle(opp.id)}>Extend</button>
                    <button type="button" className="action-chip action-chip--compact" onClick={() => void huddles.duplicateHuddleById(opp.id)}>Duplicate</button>
                    <button type="button" className="action-chip action-chip--compact" onClick={() => void huddles.cancelHuddle(opp.id)}>Cancel</button>
                  </div>
                )}
              </div>
            )}
            {isMobileWalk && (
              <button type="button" className="action-chip action-chip--compact" onClick={openDetails}>
                Details
              </button>
            )}
          </div>
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
