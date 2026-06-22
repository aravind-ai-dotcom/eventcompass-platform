/**
 * Post-event attendance and connection memory — foundation helpers.
 * Full UI workflows come later; these support merge writes without disrupting schedule UI.
 */

import type { ActivityMemory } from "@/lib/identitySignals";
import { DEFAULT_ACTIVITY_MEMORY, parseActivityMemory } from "@/lib/identitySignals";

export type SessionAttendanceOutcome =
  | "attended"
  | "partially_attended"
  | "could_not_attend"
  | "want_resources";

export function activityMemoryFromParticipant(
  raw: Record<string, unknown> | null | undefined,
): ActivityMemory {
  return parseActivityMemory(raw);
}

/** Placeholder — records how a saved session resolved after its end time. */
export function applySessionAttendanceOutcome(
  memory: ActivityMemory,
  sessionId: string,
  outcome: SessionAttendanceOutcome,
): ActivityMemory {
  const next: ActivityMemory = {
    ...memory,
    attended_sessions: memory.attended_sessions.filter(id => id !== sessionId),
    partially_attended_sessions: memory.partially_attended_sessions.filter(id => id !== sessionId),
    missed_sessions: memory.missed_sessions.filter(id => id !== sessionId),
  };

  switch (outcome) {
    case "attended":
      next.attended_sessions = [...next.attended_sessions, sessionId];
      break;
    case "partially_attended":
      next.partially_attended_sessions = [...next.partially_attended_sessions, sessionId];
      break;
    case "could_not_attend":
      next.missed_sessions = [...next.missed_sessions, sessionId];
      break;
    case "want_resources":
      next.missed_sessions = [...next.missed_sessions, sessionId];
      next.wants_session_followup = true;
      break;
  }

  return next;
}

/** Placeholder — future people-met capture. */
export function recordMetPerson(memory: ActivityMemory, personId: string): ActivityMemory {
  if (memory.met_people.includes(personId)) return memory;
  return { ...memory, met_people: [...memory.met_people, personId] };
}

/** Placeholder — future meaningful huddle capture. */
export function recordMeaningfulHuddle(memory: ActivityMemory, huddleId: string): ActivityMemory {
  if (memory.meaningful_huddles.includes(huddleId)) return memory;
  return { ...memory, meaningful_huddles: [...memory.meaningful_huddles, huddleId] };
}

export function emptyActivityMemory(): ActivityMemory {
  return { ...DEFAULT_ACTIVITY_MEMORY };
}
