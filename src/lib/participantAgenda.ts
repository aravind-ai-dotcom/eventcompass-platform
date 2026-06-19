/** Merge participant session save lists without duplicates (order: primary first, then extras). */
export function mergeSavedSessionIds(
  savedSessions: string[] = [],
  savedSchedule: string[] = [],
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const id of [...savedSessions, ...savedSchedule]) {
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
  }
  return merged;
}

/** Add an id to both session save arrays (dual-write shape). */
export function addSessionToBothLists(
  savedSessions: string[],
  savedSchedule: string[],
  id: string,
): { saved_sessions: string[]; saved_schedule: string[] } {
  return {
    saved_sessions: savedSessions.includes(id) ? savedSessions : [...savedSessions, id],
    saved_schedule: savedSchedule.includes(id) ? savedSchedule : [...savedSchedule, id],
  };
}

/** Remove an id from both session save arrays. */
export function removeSessionFromBothLists(
  savedSessions: string[],
  savedSchedule: string[],
  id: string,
): { saved_sessions: string[]; saved_schedule: string[] } {
  return {
    saved_sessions: savedSessions.filter(x => x !== id),
    saved_schedule: savedSchedule.filter(x => x !== id),
  };
}
