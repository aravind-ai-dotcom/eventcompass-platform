import type { SessionConflictInput } from "@/lib/huddleConflict";
import { huddleWindow } from "@/lib/huddleSchedule";
import { resolveDisplayStatus, statusBadgeLabel } from "@/lib/huddleStatusUi";
import { TXC_EVENT_ID } from "@/lib/compassEventPaths";
import { addMinutes, HUDDLE_DURATION_MINUTES } from "@/lib/huddleLifecycle";
import type { HuddleDoc, MatchedHuddle } from "@/types/huddleDataModel";
import type { LiveOpportunity } from "@/types/liveOpportunity";
import {
  classificationEmoji,
  classificationLabel,
} from "@/services/huddleMatchingService";

const DEMO_ATTENDEE_PAIRS = [
  ["Maya Patel", "Jordan Lee"],
  ["Alex Morgan", "Sam"],
  ["Priya Chandrasekaran", "Chris"],
  ["Elena", "Rob"],
  ["Thomas", "Lina"],
] as const;

function demoAttendeesForHuddle(huddleId: string): string[] {
  let hash = 0;
  for (let i = 0; i < huddleId.length; i += 1) {
    hash = (hash + huddleId.charCodeAt(i)) % DEMO_ATTENDEE_PAIRS.length;
  }
  return [...DEMO_ATTENDEE_PAIRS[hash]];
}

/** Demo UX — show two interested attendees when none have signed in yet. */
export function withDemoAttendeesIfEmpty(
  h: MatchedHuddle,
): Pick<MatchedHuddle, "on_my_way_count" | "on_my_way_names"> {
  const names = h.on_my_way_names ?? [];
  const count = h.on_my_way_count ?? 0;
  if (count > 0 || names.length > 0) {
    return { on_my_way_count: count, on_my_way_names: names };
  }
  const demo = demoAttendeesForHuddle(h.id);
  return { on_my_way_count: demo.length, on_my_way_names: demo };
}

export function huddleToLiveOpportunity(h: MatchedHuddle): LiveOpportunity {
  const attendees = withDemoAttendeesIfEmpty(h);
  const enriched = { ...h, ...attendees };
  const window = huddleWindow(enriched.date, enriched.start_time, enriched.end_time);
  const displayStatus = resolveDisplayStatus(enriched);

  return {
    id: enriched.id,
    category: classificationLabel(enriched.classification),
    title: enriched.title,
    description: enriched.description,
    location: enriched.location,
    startTime: enriched.start_time,
    endTime: enriched.end_time,
    scheduledAt: window?.start.toISOString(),
    expiresAt: window?.end.toISOString() ?? enriched.expires_at,
    joinedCount: enriched.on_my_way_count ?? 0,
    joinedNames: enriched.on_my_way_names ?? [],
    tags: enriched.topics,
    source: enriched.classification === "alumni"
      ? "alumni"
      : enriched.classification === "certification"
        ? "certification"
        : "networking",
    emoji: classificationEmoji(enriched.classification),
    status: statusBadgeLabel(displayStatus),
    displayStatus,
    matchReasons: enriched.match_reasons,
    filterKeys: [
      enriched.classification,
      ...enriched.topics,
      ...(enriched.target_audience.universities ?? []),
      ...(enriched.target_audience.past_employers ?? []),
    ].map(s => s.toLowerCase()),
    hostName: enriched.host_name,
    hostFirstName: enriched.host_name.split(/\s+/)[0] ?? "Host",
    hostJobTitle: enriched.host_job_title,
    hostOrganization: enriched.host_organization,
    hostParticipantId: enriched.host_participant_id,
    sessionConflict: enriched.session_conflict,
    classification: enriched.classification,
    userResponse: enriched.user_response,
  };
}

export function liveOpportunityFromHuddleDoc(h: HuddleDoc): LiveOpportunity {
  return huddleToLiveOpportunity({
    ...h,
    match_score: 0,
    match_reasons: [],
  });
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isoToScheduleParts(iso: string): { date: string; start_time: string; end_time: string } {
  const start = new Date(iso);
  const end = addMinutes(start, HUDDLE_DURATION_MINUTES);
  return {
    date: `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`,
    start_time: `${pad2(start.getHours())}:${pad2(start.getMinutes())}`,
    end_time: `${pad2(end.getHours())}:${pad2(end.getMinutes())}`,
  };
}

/** Map sample feed cards to MatchedHuddle when Firestore has no active huddles. */
export function sampleLiveOpportunityToMatched(opp: LiveOpportunity): MatchedHuddle {
  const schedule = opp.scheduledAt
    ? isoToScheduleParts(opp.scheduledAt)
    : { date: "", start_time: "", end_time: "" };
  const now = new Date().toISOString();
  const classification = (opp.classification as MatchedHuddle["classification"]) ?? "general";

  return {
    id: opp.id,
    event_id: TXC_EVENT_ID,
    title: opp.title,
    description: opp.description,
    classification,
    topics: opp.tags ?? [],
    target_audience: {},
    host_participant_id: opp.hostParticipantId ?? `sample-host-${opp.id}`,
    host_name: opp.hostName ?? "Host",
    host_job_title: opp.hostJobTitle,
    host_organization: opp.hostOrganization,
    date: schedule.date,
    start_time: schedule.start_time,
    end_time: schedule.end_time,
    timezone: "America/New_York",
    location: opp.location ?? "",
    status: opp.displayStatus === "happening_now" ? "happening_now" : "scheduled",
    visibility: "matched",
    on_my_way_count: opp.joinedCount,
    on_my_way_names: opp.joinedNames,
    created_at: now,
    updated_at: now,
    expires_at: opp.expiresAt ?? now,
    match_score: 8,
    match_reasons: opp.matchReasons,
  };
}
