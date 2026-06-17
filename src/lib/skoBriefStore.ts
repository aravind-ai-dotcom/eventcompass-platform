// Local My Brief additions — persisted per user without page reload

export type SkoBriefEntry = {
  contentId: string;
  clipId?: string;
  title: string;
  excerpt?: string;
  addedAt: string;
};

const KEY = "sko-brief-entries";

function storageKey(uid: string): string {
  return `${KEY}:${uid}`;
}

export function loadBriefEntries(uid: string): SkoBriefEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(uid));
    return raw ? (JSON.parse(raw) as SkoBriefEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveBriefEntries(uid: string, entries: SkoBriefEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(uid), JSON.stringify(entries));
}

export function isInBrief(
  entries: SkoBriefEntry[],
  contentId: string,
  clipId?: string,
): boolean {
  return entries.some(e =>
    clipId ? e.clipId === clipId : e.contentId === contentId && !e.clipId,
  );
}

export function addBriefEntry(uid: string, entry: SkoBriefEntry): SkoBriefEntry[] {
  const current = loadBriefEntries(uid);
  if (isInBrief(current, entry.contentId, entry.clipId)) return current;
  const next = [...current, entry];
  saveBriefEntries(uid, next);
  return next;
}
