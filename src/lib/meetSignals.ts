const STORAGE_KEY = "compass_love_to_meet_signals";

export interface MeetSignalRecord {
  personId: string;
  displayName: string;
  sentAt: string;
}

function readAll(): MeetSignalRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MeetSignalRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(records: MeetSignalRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getMeetSignal(personId: string): MeetSignalRecord | undefined {
  return readAll().find(r => r.personId === personId);
}

export function hasMeetSignal(personId: string): boolean {
  return !!getMeetSignal(personId);
}

export function sendCanWeMeetSignal(personId: string, displayName: string): MeetSignalRecord {
  const record: MeetSignalRecord = {
    personId,
    displayName,
    sentAt: new Date().toISOString(),
  };
  const next = readAll().filter(r => r.personId !== personId);
  next.push(record);
  writeAll(next);
  return record;
}

export function clearMeetSignal(personId: string): void {
  writeAll(readAll().filter(r => r.personId !== personId));
}

/** @deprecated Use sendCanWeMeetSignal */
export const sendLoveToMeetSignal = sendCanWeMeetSignal;
