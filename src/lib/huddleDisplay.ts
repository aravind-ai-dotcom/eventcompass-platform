import type { SessionConflictInput } from "@/lib/huddleConflict";
import { huddleWindow } from "@/lib/huddleSchedule";
import type { HuddleDoc, MatchedHuddle } from "@/types/huddleDataModel";
import type { LiveOpportunity } from "@/types/liveOpportunity";
import {
  classificationEmoji,
  classificationLabel,
} from "@/services/huddleMatchingService";

export function huddleToLiveOpportunity(h: MatchedHuddle): LiveOpportunity {
  const window = huddleWindow(h.date, h.start_time, h.end_time);
  const isLive = h.status === "happening_now";

  return {
    id: h.id,
    category: classificationLabel(h.classification),
    title: h.title,
    description: h.description,
    location: h.location,
    startTime: h.start_time,
    endTime: h.end_time,
    scheduledAt: window?.start.toISOString(),
    expiresAt: window?.end.toISOString() ?? h.expires_at,
    joinedCount: h.on_my_way_count ?? 0,
    joinedNames: h.on_my_way_names ?? [],
    tags: h.topics,
    source: h.classification === "alumni"
      ? "alumni"
      : h.classification === "certification"
        ? "certification"
        : "networking",
    emoji: classificationEmoji(h.classification),
    status: isLive ? "Happening now" : h.status === "scheduled" ? "Scheduled" : h.status,
    matchReasons: h.match_reasons,
    filterKeys: [
      h.classification,
      ...h.topics,
      ...(h.target_audience.universities ?? []),
      ...(h.target_audience.past_employers ?? []),
    ].map(s => s.toLowerCase()),
    hostName: h.host_name,
    hostFirstName: h.host_name.split(/\s+/)[0] ?? "Host",
    sessionConflict: h.session_conflict,
    classification: h.classification,
    userResponse: h.user_response,
  };
}

export function liveOpportunityFromHuddleDoc(h: HuddleDoc): LiveOpportunity {
  return huddleToLiveOpportunity({
    ...h,
    match_score: 0,
    match_reasons: [],
  });
}
