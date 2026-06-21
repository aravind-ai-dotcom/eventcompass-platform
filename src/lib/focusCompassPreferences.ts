export const FOCUS_COMPASS_GROUP_IDS = [
  "today",
  "conversations",
  "learning",
  "moments",
  "people",
  "certifications",
  "community",
] as const;

export type FocusCompassGroupId = (typeof FOCUS_COMPASS_GROUP_IDS)[number];

export type FocusCompassGroupState = Record<FocusCompassGroupId, boolean>;

export const FOCUS_COMPASS_STORAGE_KEY = "focus_compass_groups";

export const COMPASS_MOBILE_BREAKPOINT = 768;

function defaultGroups(): FocusCompassGroupState {
  return {
    today: true,
    conversations: false,
    learning: false,
    moments: false,
    people: false,
    certifications: false,
    community: false,
  };
}

export function defaultFocusCompassGroups(_isMobile = false): FocusCompassGroupState {
  return defaultGroups();
}

function isGroupId(value: string): value is FocusCompassGroupId {
  return (FOCUS_COMPASS_GROUP_IDS as readonly string[]).includes(value);
}

export function readFocusCompassGroups(isMobile = false): FocusCompassGroupState {
  const defaults = defaultFocusCompassGroups(isMobile);
  if (typeof window === "undefined") return defaults;

  try {
    const raw = localStorage.getItem(FOCUS_COMPASS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<FocusCompassGroupState>;
    const groups = { ...defaults };
    for (const [key, value] of Object.entries(parsed)) {
      if (isGroupId(key) && typeof value === "boolean") groups[key] = value;
    }
    return groups;
  } catch {
    return defaults;
  }
}

export function writeFocusCompassGroups(groups: FocusCompassGroupState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FOCUS_COMPASS_STORAGE_KEY, JSON.stringify(groups));
}
