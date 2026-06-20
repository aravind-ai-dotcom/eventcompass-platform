import { huddleWindow } from "@/lib/huddleSchedule";

export interface SessionConflictInput {
  id: string;
  title: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  schedule?: {
    date?: string;
    start_time?: string;
    end_time?: string;
  };
}

function sessionWindow(s: SessionConflictInput): { start: Date; end: Date } | null {
  const date = s.date ?? s.schedule?.date;
  const startTime = s.start_time ?? s.schedule?.start_time;
  const endTime = s.end_time ?? s.schedule?.end_time;
  if (!date || !startTime) return null;
  const end = endTime ?? startTime;
  return huddleWindow(date, startTime.slice(0, 5), end.slice(0, 5));
}

function overlaps(
  a: { start: Date; end: Date },
  b: { start: Date; end: Date },
): boolean {
  return a.start < b.end && b.start < a.end;
}

export function findSessionConflict(
  huddleDate: string,
  huddleStart: string,
  huddleEnd: string,
  savedSessionIds: string[],
  sessions: SessionConflictInput[],
): string | undefined {
  const hw = huddleWindow(huddleDate, huddleStart, huddleEnd);
  if (!hw || savedSessionIds.length === 0) return undefined;

  const saved = new Set(savedSessionIds);
  for (const session of sessions) {
    if (!saved.has(session.id)) continue;
    const sw = sessionWindow(session);
    if (sw && overlaps(hw, sw)) {
      return session.title;
    }
  }
  return undefined;
}
